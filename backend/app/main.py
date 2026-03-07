import hashlib
import logging
import os
import shutil
import time

import networkx as nx
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Security, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader

from app.services.graph_builder import build_transaction_graph
from app.services.cycle_detector import detect_cycles
from app.services.ring_manager import assign_ring_ids
from app.services.smurf_detector import detect_smurfing
from app.services.shell_detector import detect_shell_chains
from app.services.anomaly_detector import detect_anomalies_with_scores
from app.services.scoring_engine import calculate_suspicion_scores
from app.database import init_db, SessionLocal, SuspiciousHistory


# =====================================================
# LOGGING
# =====================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("muleguard")


# =====================================================
# CONFIG
# =====================================================
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB hard limit
MAX_ROWS             = 100_000           # row cap to prevent OOM
ALLOWED_EXTENSIONS   = {".csv"}

API_SECRET_KEY = os.getenv("API_SECRET_KEY")  # set in Render env vars — leave blank to disable auth in dev
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

REQUIRED_COLUMNS = [
    "transaction_id",
    "sender_id",
    "receiver_id",
    "amount",
    "timestamp",
]

# =====================================================
# CORS
# =====================================================
DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://mule-guard-ai-7j47.vercel.app",   # production frontend — update if URL changes
]
env_origins = [
    o.strip() for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()
]
frontend_origins = list(set(DEFAULT_FRONTEND_ORIGINS + env_origins))

# =====================================================
# PATHS
# =====================================================
BASE_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "data", "uploads")

# =====================================================
# IN-MEMORY RESULT CACHE  (md5 → JSON response)
# Avoids reprocessing the exact same CSV twice per session.
# =====================================================
_result_cache: dict[str, dict] = {}


# =====================================================
# APP INITIALIZATION
# =====================================================
app = FastAPI(
    title="MuleGuard AI Backend",
    description="Hybrid fraud-intelligence engine for money-mule detection.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],            # tightened from wildcard
    allow_headers=["Content-Type", "X-API-Key"],
)

init_db()


# =====================================================
# AUTH DEPENDENCY
# =====================================================
async def verify_api_key(key: str = Security(api_key_header)):
    """
    When API_SECRET_KEY env var is set, every protected endpoint requires:
        Header: X-API-Key: <your_secret>
    In local dev (env var not set) auth is skipped automatically.
    """
    if API_SECRET_KEY and key != API_SECRET_KEY:
        logger.warning("Rejected request — invalid or missing API key.")
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key.")


# =====================================================
# RATE LIMITER  (simple in-memory, no Redis needed)
# =====================================================
_rate_store: dict[str, list[float]] = {}
RATE_LIMIT   = 10      # max requests
RATE_WINDOW  = 60.0    # per 60 seconds

def check_rate_limit(request: Request):
    ip  = request.client.host if request.client else "unknown"
    now = time.time()
    hits = _rate_store.get(ip, [])
    # Drop timestamps outside the window
    hits = [t for t in hits if now - t < RATE_WINDOW]
    if len(hits) >= RATE_LIMIT:
        logger.warning(f"Rate limit exceeded for IP: {ip}")
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Max {RATE_LIMIT} uploads per {int(RATE_WINDOW)}s."
        )
    hits.append(now)
    _rate_store[ip] = hits


# =====================================================
# HELPERS
# =====================================================
def _friendly_error(msg: str) -> str:
    """Map raw backend errors to user-readable messages."""
    if "missing_columns" in msg:
        return "CSV is missing required columns. Check the template."
    if "timestamp" in msg.lower():
        return "One or more timestamp values are invalid. Use ISO 8601 format."
    if "too large" in msg.lower():
        return f"File too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
    if "rows" in msg.lower():
        return f"CSV exceeds the {MAX_ROWS:,}-row limit."
    return msg


# =====================================================
# HEALTH ENDPOINTS
# =====================================================
@app.get("/")
def health_check():
    """Basic liveness probe — used by frontend ping."""
    return {"status": "OK", "message": "MuleGuard AI Backend running 🚀"}


@app.get("/health/")
def detailed_health():
    """Deep health check — verifies DB connectivity."""
    db = SessionLocal()
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        db_status = "error"
    finally:
        db.close()

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "db": db_status,
        "version": "1.1.0",
        "limits": {
            "max_file_size_mb": MAX_FILE_SIZE_BYTES // (1024 * 1024),
            "max_rows": MAX_ROWS,
            "rate_limit": f"{RATE_LIMIT} uploads / {int(RATE_WINDOW)}s per IP",
        },
    }


# =====================================================
# UPLOAD ENDPOINT
# =====================================================
@app.post("/upload/")
async def upload_file(
    request:  Request,
    file:     UploadFile = File(...),
    _auth=    Depends(verify_api_key),
):
    _check = check_rate_limit(request)   # raises 429 if exceeded
    start_time = time.time()
    file_path  = None
    db         = None

    logger.info(f"Upload received — '{file.filename}' from {request.client.host if request.client else 'unknown'}")

    try:
        # ── 1. EXTENSION CHECK ────────────────────────────────
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

        # ── 2. READ ENTIRE FILE + SIZE CHECK ─────────────────
        content   = await file.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({file_size // (1024*1024)} MB). Maximum is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
            )

        # ── 3. MD5 CACHE — skip reprocessing identical files ──
        file_md5 = hashlib.md5(content).hexdigest()
        if file_md5 in _result_cache:
            logger.info(f"Cache hit for md5={file_md5} — returning cached result instantly.")
            return JSONResponse(_result_cache[file_md5])

        # ── 4. SAVE TO DISK (md5-prefixed to avoid collisions) ─
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        safe_name = f"{file_md5}_{os.path.basename(file.filename)}"
        file_path = os.path.join(UPLOAD_FOLDER, safe_name)

        with open(file_path, "wb") as buf:
            buf.write(content)

        # ── 5. PARSE CSV ──────────────────────────────────────
        try:
            df = pd.read_csv(file_path)
        except Exception:
            raise HTTPException(status_code=400, detail="Could not parse file as CSV. Check formatting.")

        # ── 6. ROW LIMIT ──────────────────────────────────────
        if len(df) > MAX_ROWS:
            raise HTTPException(
                status_code=400,
                detail=f"CSV has {len(df):,} rows. Maximum allowed is {MAX_ROWS:,}."
            )

        # ── 7. COLUMN VALIDATION ──────────────────────────────
        missing_columns = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid CSV format — missing required columns.",
                    "missing_columns": missing_columns,
                    "required_columns": REQUIRED_COLUMNS,
                }
            )

        # ── 8. TIMESTAMP PARSING ──────────────────────────────
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        if df["timestamp"].isnull().any():
            bad_count = int(df["timestamp"].isnull().sum())
            raise HTTPException(
                status_code=400,
                detail=f"Invalid timestamp format in {bad_count} row(s). Use ISO 8601 (e.g. 2024-01-15T10:30:00)."
            )

        # ── 9. BUILD GRAPH ────────────────────────────────────
        logger.info(f"Building graph for {len(df):,} transactions...")
        G = build_transaction_graph(df)

        degree_centrality     = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G, normalized=True)
        pagerank_scores        = nx.pagerank(G)

        # ── 10. PATTERN DETECTION ─────────────────────────────
        cycles = detect_cycles(G)
        fraud_rings, suspicious_accounts = assign_ring_ids(cycles)

        smurf_rings, smurf_accounts = detect_smurfing(df)
        fraud_rings.extend(smurf_rings)
        suspicious_accounts.extend(smurf_accounts)

        shell_rings, shell_accounts = detect_shell_chains(G)
        fraud_rings.extend(shell_rings)
        suspicious_accounts.extend(shell_accounts)

        # Deduplicate accounts
        unique_accounts = {}
        for acc in suspicious_accounts:
            unique_accounts[acc["account_id"]] = acc
        suspicious_accounts = list(unique_accounts.values())

        # ── 11. ANOMALY DETECTION ─────────────────────────────
        anomaly_scores = detect_anomalies_with_scores(G, df)

        # ── 12. SCORING + DB ──────────────────────────────────
        db = SessionLocal()

        suspicious_accounts = calculate_suspicion_scores(
            suspicious_accounts,
            df,
            degree_centrality,
            betweenness_centrality,
            pagerank_scores,
            anomaly_scores,
            db,
        )

        # Dynamic threshold (top 30% of scores, min 40)
        if suspicious_accounts:
            scores            = [acc["suspicion_score"] for acc in suspicious_accounts]
            dynamic_threshold = max(40, np.percentile(scores, 70))
        else:
            dynamic_threshold = 40

        suspicious_accounts = [
            acc for acc in suspicious_accounts
            if acc["suspicion_score"] >= dynamic_threshold
        ]

        # Clean rings — keep only those with at least one surviving member
        valid_ids   = {acc["account_id"] for acc in suspicious_accounts}
        fraud_rings = [
            ring for ring in fraud_rings
            if any(m in valid_ids for m in ring["member_accounts"])
        ]

        # Persist history
        for acc in suspicious_accounts:
            record = db.query(SuspiciousHistory).filter(
                SuspiciousHistory.account_id == acc["account_id"]
            ).first()

            if record:
                record.last_score   = acc["suspicion_score"]
                record.times_flagged += 1
            else:
                db.add(SuspiciousHistory(
                    account_id=acc["account_id"],
                    last_score=acc["suspicion_score"],
                    times_flagged=1,
                ))

        db.commit()

        processing_time = round(time.time() - start_time, 2)
        logger.info(
            f"Analysis complete in {processing_time}s — "
            f"{len(suspicious_accounts)} flagged, {len(fraud_rings)} rings, "
            f"{G.number_of_nodes()} nodes, {G.number_of_edges()} edges."
        )

        # ── 13. SERIALIZE + CACHE + RESPOND ──────────────────
        df["timestamp"] = df["timestamp"].astype(str)

        response_payload = {
            "fraud_rings":          fraud_rings,
            "suspicious_accounts":  suspicious_accounts,
            "summary": {
                "total_accounts_analyzed":    G.number_of_nodes(),
                "total_transactions":         G.number_of_edges(),
                "suspicious_accounts_flagged": len(suspicious_accounts),
                "fraud_rings_detected":       len(fraud_rings),
                "processing_time_seconds":    processing_time,
            },
            "raw_transactions": df.to_dict(orient="records"),
            "message": "Hybrid Fraud Intelligence Engine completed 🚀🔥",
        }

        # Cache result so identical re-uploads are instant
        _result_cache[file_md5] = response_payload

        return JSONResponse(response_payload)

    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Unhandled error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=_friendly_error(str(e)))

    finally:
        # Always clean up the uploaded file from disk
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up temp file: {file_path}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to delete temp file: {cleanup_err}")
        if db:
            db.close()


# =====================================================
# HISTORY ENDPOINT
# =====================================================
@app.get("/history/")
def get_history(_auth=Depends(verify_api_key)):
    db = SessionLocal()
    try:
        records = db.query(SuspiciousHistory).order_by(
            SuspiciousHistory.times_flagged.desc()
        ).all()

        history = [
            {
                "account_id":    r.account_id,
                "last_score":    r.last_score,
                "times_flagged": r.times_flagged,
                "last_flagged_at": str(r.last_flagged_at),
            }
            for r in records
        ]

        logger.info(f"History requested — {len(history)} records returned.")
        return {"total_records": len(history), "history": history}

    finally:
        db.close()
