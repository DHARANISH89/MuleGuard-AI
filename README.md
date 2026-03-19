# 🛡️ MuleGuard AI

> **Financial Forensics Engine** — Detect money laundering and money mule networks using graph-based anomaly detection, dynamic risk scoring, and interactive fund-flow visualization.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mule--guard--ai.vercel.app-blue?style=for-the-badge&logo=vercel)](https://mule-guard-ai-7j47.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)]()

---

## 🌐 Live Demo

**[https://mule-guard-ai-7j47.vercel.app/](https://mule-guard-ai-7j47.vercel.app/)**

---

## 📌 What is MuleGuard AI?

MuleGuard AI is an open-source financial forensics tool that models transaction data as a directed graph and applies network analysis algorithms to surface suspicious patterns — including layered shell chains, smurfing rings, and high-velocity cycling accounts — in real time.

It is designed for:
- **Compliance teams** investigating AML (Anti-Money Laundering) alerts
- **Fraud analysts** mapping account relationship networks
- **Researchers** studying financial crime topology

---

## 🧠 Core Features

| Feature | Description |
|---|---|
| **Graph Topology Visualization** | D3.js-powered node-edge graph showing fund flow between accounts |
| **Ring / Cycle Detection** | Identifies closed transaction loops characteristic of layering |
| **Smurfing Detection** | Flags structuring patterns — multiple small transactions to avoid thresholds |
| **Shell Chain Analysis** | Traces high-velocity pass-through accounts with no economic purpose |
| **Dynamic Risk Scoring** | Per-node anomaly score using PageRank + betweenness centrality |
| **Mule Flag System** | Automated classification of high-risk nodes with evidence summary |

---

## 🏗️ Architecture

```
MuleGuard/
├── backend/          # FastAPI · NetworkX · Pandas · Scikit-learn
│   ├── main.py
│   ├── graph/        # Graph construction & algorithm logic
│   ├── models/       # Pydantic request/response schemas
│   └── Dockerfile
│
├── frontend/         # React · D3.js
│   ├── src/
│   │   ├── components/   # Graph canvas, risk panels, filters
│   │   └── api/          # Backend API client
│   └── Dockerfile
│
├── docker-compose.yml
└── render.yaml       # Render blueprint for backend deployment
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/DHARANISH89/MuleGuard.git
cd MuleGuard

# 2. Start the full stack
docker compose up -d --build
```

| Service | URL |
|---|---|
| Frontend UI | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## ☁️ Deployment

MuleGuard uses a split-deploy strategy — backend on Render, frontend on Vercel — for cost efficiency and performance.

### Backend → Render

1. Connect your GitHub repo to [Render](https://render.com/)
2. Create a new **Blueprint** — Render auto-detects `render.yaml` and configures the FastAPI service
3. Note your deployed URL (e.g., `https://muleguard-backend.onrender.com`)

### Frontend → Vercel

1. Import the repo into [Vercel](https://vercel.com/)
2. Set the **Root Directory** to `frontend/`
3. Add the environment variable:

```
REACT_APP_API_URL=https://muleguard-backend.onrender.com
```

4. Deploy

> ⚠️ After both are live, update the `FRONTEND_ORIGINS` environment variable on Render to whitelist your Vercel app URL (required for CORS).

---

## 🔬 How It Works

```
Raw Transaction CSV
       │
       ▼
  Graph Builder (NetworkX)
  ─ Nodes = accounts
  ─ Edges = transactions (weighted by amount/frequency)
       │
       ▼
  Algorithm Layer
  ─ PageRank → influence score
  ─ Betweenness Centrality → bridge node detection
  ─ Cycle Detection → ring networks
  ─ Threshold Analysis → smurfing patterns
       │
       ▼
  Risk Scorer (Scikit-learn)
  ─ Composite anomaly score per node
  ─ Binary mule flag + confidence
       │
       ▼
  REST API (FastAPI)  ──►  React Dashboard (D3.js)
```

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — API framework
- [NetworkX](https://networkx.org/) — Graph construction and algorithms
- [Pandas](https://pandas.pydata.org/) — Data ingestion and transformation
- [Scikit-learn](https://scikit-learn.org/) — Anomaly scoring models

**Frontend**
- [React](https://react.dev/) — UI framework
- [D3.js](https://d3js.org/) — Graph and network visualization

**Infrastructure**
- [Docker Compose](https://docs.docker.com/compose/) — Local development
- [Render](https://render.com/) — Backend hosting
- [Vercel](https://vercel.com/) — Frontend hosting

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork → clone → create a branch
git checkout -b feature/your-feature-name

# Make changes, then open a Pull Request
```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ to make financial crime detection more accessible</p>
