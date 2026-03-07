import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import './App.css';

// ============================================
// CONFIG — set your deployed backend URL here
// ============================================
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('🔍 API_BASE:', API_BASE);

// Icons
const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Filter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Ring: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
  Alert: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Server: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
};

// Clock Hook
const useClock = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);
  return time;
};

// Search Component
const SearchBar = ({ value, onChange, placeholder = "Search accounts, rings..." }) => (
  <div className="search-bar">
    <div className="search-input-wrap">
      <Icons.Search />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button className="clear-btn" onClick={() => onChange('')}><Icons.Close /></button>}
    </div>
    <button className="filter-btn"><Icons.Filter /><span>Filter</span></button>
  </div>
);

// Navbar
const Navbar = ({ searchValue, onSearchChange, hasData, backendStatus }) => {
  const clock = useClock();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="logo">
          <div className="logo-box">R</div>
          <div className="logo-text">
            <h1>M.G</h1>
            <span>MULE GUARD AI</span>
          </div>
        </div>

        {hasData && (
          <div className="nav-search desktop-only">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>
        )}

        <div className="nav-status desktop-only">
          <span className={`status-dot ${backendStatus === 'online' ? '' : backendStatus === 'checking' ? 'checking' : 'offline'}`}></span>
          <span className="status-text">
            {backendStatus === 'online' ? 'BACKEND ONLINE' : backendStatus === 'checking' ? 'CONNECTING...' : 'BACKEND OFFLINE'}
          </span>
          <span className="clock">{clock}</span>
        </div>

        <button className="menu-btn mobile-only" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-menu mobile-only">
          {hasData && <SearchBar value={searchValue} onChange={onSearchChange} />}
          <div className="mobile-status"><span className="status-dot"></span><span>SYSTEM ONLINE • {clock}</span></div>
        </div>
      )}
    </nav>
  );
};

// Radar Animation
const Radar = () => (
  <div className="radar">
    <div className="radar-sweep"></div>
    <div className="radar-rings"><span></span><span></span><span></span><span></span></div>
    <div className="radar-center">SCAN</div>
  </div>
);

// Upload Zone
const UploadZone = ({ onFile, processing, backendStatus }) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) onFile(file);
  };

  return (
    <div className={`upload-zone ${drag ? 'dragover' : ''} ${processing ? 'processing' : ''}`}
         onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
         onDragLeave={() => setDrag(false)}
         onDrop={handleDrop}>
      <input type="file" ref={inputRef} accept=".csv" hidden onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div className="upload-content">
        <div className="upload-icon"><Icons.Upload /></div>
        <h3>INITIALIZE DATA STREAM</h3>
        <p>Drop CSV transaction data or click to browse</p>
        {backendStatus === 'offline' && (
          <div className="backend-warning">
            ⚠ Backend offline — check <code>REACT_APP_API_URL</code>
          </div>
        )}
        <button className="btn-primary" onClick={() => inputRef.current?.click()} disabled={processing}>
          {processing ? 'UPLOADING TO BACKEND...' : 'SELECT FILE'}
        </button>
        <div className="file-fields">
          <span>transaction_id</span>
          <span>sender_id</span>
          <span>receiver_id</span>
          <span>amount</span>
          <span>timestamp</span>
        </div>
      </div>
      {processing && <div className="scan-line"></div>}
    </div>
  );
};

// Processing Status
const ProcessingStatus = ({ progress, msg, mode }) => (
  <div className="processing-status">
    <div className="status-box">
      <div className="status-row">
        <span>{mode === 'upload' ? 'UPLOADING TO BACKEND' : 'ANALYZING NETWORK'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="progress-bg"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
      <div className="terminal">{msg}</div>
    </div>
  </div>
);

// Error Banner
const ErrorBanner = ({ error, onDismiss }) => (
  <div className="error-banner">
    <Icons.Alert />
    <span>{error}</span>
    <button onClick={onDismiss}><Icons.Close /></button>
  </div>
);

// ============================================
// BUILD nodeMap + links FROM RAW TRANSACTIONS
// ============================================
const buildGraphData = (rawTransactions) => {
  const nodeMap = new Map();
  const links = [];

  (rawTransactions || []).forEach(d => {
    const sid = String(d.sender_id);
    const rid = String(d.receiver_id);
    if (!sid || !rid || sid === 'undefined' || rid === 'undefined') return;

    if (!nodeMap.has(sid)) nodeMap.set(sid, { id: sid, in: [], out: [] });
    if (!nodeMap.has(rid)) nodeMap.set(rid, { id: rid, in: [], out: [] });

    const amount = parseFloat(d.amount) || 0;
    links.push({
      source: sid,
      target: rid,
      amount,
      timestamp: d.timestamp,
      id: d.transaction_id
    });
    nodeMap.get(sid).out.push({ target: rid, amount });
    nodeMap.get(rid).in.push({ source: sid, amount });
  });

  return { nodeMap, links };
};

// ============================================
// GRAPH VISUALIZATION — IMPROVED
// ============================================

const GraphVisualization = ({ analysisData, searchTerm, onNodeSelect, selectedNode }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const zoomRef = useRef(null);
  const [, setZoom] = useState(1);
  const [physics, setPhysics] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [ringCount, setRingCount] = useState(0);

  // Build ring membership map for fast lookup
  const ringMemberMap = useMemo(() => {
    const map = new Map(); // accountId -> ringId
    (analysisData?.fraud_rings || []).forEach(ring => {
      ring.member_accounts.forEach(id => map.set(String(id), ring.ring_id));
    });
    return map;
  }, [analysisData]);

  const { displayNodes, displayLinks } = useMemo(() => {
    if (!analysisData) return { displayNodes: [], displayLinks: [] };

    const { suspicious_accounts = [], nodeMap, links: allLinks = [] } = analysisData;

    // Collect all IDs to show
    const showSet = new Set();

    const filteredAccounts = searchTerm
      ? suspicious_accounts.filter(a => String(a.account_id).toLowerCase().includes(searchTerm.toLowerCase()))
      : suspicious_accounts;

    filteredAccounts.forEach(a => showSet.add(String(a.account_id)));

    // Also show direct neighbors of suspicious accounts
    allLinks.forEach(l => {
      const s = String(l.source), t = String(l.target);
      if (showSet.has(s) || showSet.has(t)) {
        showSet.add(s);
        showSet.add(t);
      }
    });

    // Build node objects
    const nodeArr = Array.from(showSet).map(id => {
      const node = nodeMap?.get(id);
      const acc = suspicious_accounts.find(a => String(a.account_id) === id);
      const ringId = ringMemberMap.get(id) || acc?.ring_id || null;
      const risk = acc?.suspicion_score ?? 20;

      return {
        id,
        risk,
        type: ringId ? 'ring' : acc ? 'suspicious' : 'normal',
        ringId,
        patterns: acc?.detected_patterns || [],
        inCount: node?.in?.length || 0,
        outCount: node?.out?.length || 0,
      };
    });

    const linkArr = allLinks.filter(l => showSet.has(String(l.source)) && showSet.has(String(l.target)));

    return { displayNodes: nodeArr, displayLinks: linkArr };
  }, [analysisData, searchTerm, ringMemberMap]);

  useEffect(() => {
    setNodeCount(displayNodes.length);
    setLinkCount(displayLinks.length);
    setRingCount((analysisData?.fraud_rings || []).length);
  }, [displayNodes, displayLinks, analysisData]);

  useEffect(() => {
    if (!displayNodes.length || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const W = container.clientWidth || 900;
    const H = 560;

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove();
    svgEl.attr('width', W).attr('height', H);

    // ---- Defs ----
    const defs = svgEl.append('defs');

    // Glow filter for ring nodes
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '4').attr('result', 'blur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Subtle glow for high-risk
    const glowMild = defs.append('filter').attr('id', 'glow-mild').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glowMild.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '2').attr('result', 'blur');
    const fm2 = glowMild.append('feMerge');
    fm2.append('feMergeNode').attr('in', 'blur');
    fm2.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow-normal').attr('viewBox', '0 -4 8 8').attr('refX', 14).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#00f3ff').attr('opacity', 0.6);

    defs.append('marker')
      .attr('id', 'arrow-high').attr('viewBox', '0 -4 8 8').attr('refX', 14).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#ff003c').attr('opacity', 0.8);

    // Background grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'grid').attr('width', 40).attr('height', 40).attr('patternUnits', 'userSpaceOnUse');
    pattern.append('path').attr('d', 'M 40 0 L 0 0 0 40').attr('fill', 'none').attr('stroke', 'rgba(0,243,255,0.04)').attr('stroke-width', 1);

    svgEl.append('rect').attr('width', W).attr('height', H).attr('fill', 'url(#grid)');

    const g = svgEl.append('g').attr('class', 'graph-g');

    // ---- Zoom ----
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.08, 6])
      .on('zoom', (e) => {
        g.attr('transform', e.transform);
        setZoom(e.transform.k);
      });
    zoomRef.current = zoomBehavior;
    svgEl.call(zoomBehavior);

    // ---- Group ring members by ring for cluster forces ----
    const ringGroups = new Map();
    displayNodes.forEach(n => {
      if (n.ringId) {
        if (!ringGroups.has(n.ringId)) ringGroups.set(n.ringId, []);
        ringGroups.get(n.ringId).push(n.id);
      }
    });

    // Assign cluster centers for rings
    const ringCenters = new Map();
    let ri = 0;
    ringGroups.forEach((members, ringId) => {
      const angle = (ri / ringGroups.size) * Math.PI * 2;
      const r = Math.min(W, H) * 0.28;
      ringCenters.set(ringId, {
        x: W / 2 + r * Math.cos(angle),
        y: H / 2 + r * Math.sin(angle)
      });
      ri++;
    });

    // ---- Force Simulation ----
    const nodesCopy = displayNodes.map(d => ({ ...d }));
    const linksCopy = displayLinks.map(d => ({ ...d }));

    const nodeById = new Map(nodesCopy.map(n => [n.id, n]));

    // Resolve link source/target to node objects
    const resolvedLinks = linksCopy.map(l => ({
      ...l,
      source: nodeById.get(String(l.source)) || String(l.source),
      target: nodeById.get(String(l.target)) || String(l.target),
    })).filter(l => typeof l.source === 'object' && typeof l.target === 'object');

    const sim = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(resolvedLinks)
        .id(d => d.id)
        .distance(d => {
          const isRingLink = d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId;
          if (isRingLink) return 70;
          if (d.amount > 10000) return 120;
          if (d.amount > 1000) return 95;
          return 80;
        })
        .strength(d => {
          const isRingLink = d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId;
          return isRingLink ? 0.9 : 0.3;
        })
      )
      .force('charge', d3.forceManyBody().strength(d => {
        if (d.type === 'ring') return -600;
        if (d.risk > 80) return -400;
        if (d.risk > 50) return -250;
        return -150;
      }))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.05))
      .force('collision', d3.forceCollide().radius(d => {
        if (d.type === 'ring') return 36;
        if (d.risk > 80) return 24;
        return 16;
      }).strength(0.8))
      // Pull ring members toward their ring center
      .force('cluster', alpha => {
        nodesCopy.forEach(n => {
          if (n.ringId && ringCenters.has(n.ringId)) {
            const c = ringCenters.get(n.ringId);
            n.vx += (c.x - n.x) * alpha * 0.25;
            n.vy += (c.y - n.y) * alpha * 0.25;
          }
        });
      })
      .alphaDecay(0.018)
      .velocityDecay(0.35);

    simRef.current = sim;

    // ---- Links ----
    const linkColor = d => {
      if (d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId) return '#ff00ff';
      if (d.amount > 10000) return '#ff003c';
      if (d.amount > 5000) return '#ff6b6b';
      if (d.amount > 1000) return '#ffd93d';
      return '#00f3ff';
    };

    const linkGroup = g.append('g').attr('class', 'links');
    const linkEl = linkGroup.selectAll('line')
      .data(resolvedLinks)
      .join('line')
      .attr('stroke', linkColor)
      .attr('stroke-opacity', d => {
        const isRingLink = d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId;
        return isRingLink ? 0.85 : 0.4;
      })
      .attr('stroke-width', d => {
        const isRingLink = d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId;
        if (isRingLink) return 2.5;
        return Math.max(0.8, Math.min(3, Math.log10(d.amount + 1) * 0.7));
      })
      .attr('marker-end', d => d.amount > 5000 ? 'url(#arrow-high)' : 'url(#arrow-normal)');

    // Invisible hit area
    const linkHitEl = g.append('g').attr('class', 'link-hits')
      .selectAll('line')
      .data(resolvedLinks)
      .join('line')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 14)
      .style('cursor', 'pointer');

    // ---- Ring halos (background circles for ring clusters) ----
    const ringHaloGroup = g.append('g').attr('class', 'ring-halos');
    const ringHaloData = Array.from(ringGroups.entries()).map(([ringId, members]) => ({
      ringId,
      center: ringCenters.get(ringId)
    }));

    const ringHalos = ringHaloGroup.selectAll('circle')
      .data(ringHaloData)
      .join('circle')
      .attr('r', 60)
      .attr('fill', 'rgba(255,0,255,0.04)')
      .attr('stroke', '#ff00ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);

    // ---- Node groups ----
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeEl = nodeGroup.selectAll('g')
      .data(nodesCopy)
      .join('g')
      .attr('class', d => `node node-${d.type}`)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Node radius helper
    const nodeRadius = d => {
      if (d.type === 'ring') return 13;
      if (d.risk > 85) return 11;
      if (d.risk > 70) return 9;
      if (d.risk > 50) return 7;
      return 5;
    };

    // Node fill color
    const nodeFill = d => {
      if (d.type === 'ring') return '#cc0033';
      if (d.risk > 85) return '#ff4455';
      if (d.risk > 70) return '#ff8844';
      if (d.risk > 50) return '#ffd93d';
      return '#00f3ff';
    };

    // Node stroke color
    const nodeStroke = d => {
      if (d.type === 'ring') return '#ff00ff';
      if (d.risk > 70) return '#ff003c';
      if (d.risk > 50) return '#ffd93d';
      return 'rgba(255,255,255,0.4)';
    };

    nodeEl.each(function (d) {
      const el = d3.select(this);
      const r = nodeRadius(d);

      // Outer pulse ring for ring members
      if (d.type === 'ring') {
        el.append('circle')
          .attr('r', r + 10)
          .attr('fill', 'none')
          .attr('stroke', '#ff00ff')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.35)
          .attr('class', 'pulse-ring');

        el.append('circle')
          .attr('r', r + 20)
          .attr('fill', 'none')
          .attr('stroke', '#ff00ff')
          .attr('stroke-width', 0.5)
          .attr('stroke-opacity', 0.15);
      }

      // Dashed orbit for high risk
      if (d.risk > 60 && d.type !== 'ring') {
        el.append('circle')
          .attr('r', r + 6)
          .attr('fill', 'none')
          .attr('stroke', d.risk > 80 ? '#ff003c' : '#ffd93d')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('stroke-opacity', 0.6);
      }

      // Main circle
      el.append('circle')
        .attr('r', r)
        .attr('fill', nodeFill(d))
        .attr('stroke', nodeStroke(d))
        .attr('stroke-width', d.type === 'ring' ? 2.5 : 1.5)
        .style('filter', d.type === 'ring' ? 'url(#glow)' : d.risk > 80 ? 'url(#glow-mild)' : 'none');

      // Inner dot for ring members
      if (d.type === 'ring') {
        el.append('circle')
          .attr('r', 3)
          .attr('fill', '#ff00ff')
          .attr('opacity', 0.9);
      }
    });

    // ---- Labels ----
    const labelGroup = g.append('g').attr('class', 'labels');
    const labelEl = labelGroup.selectAll('text')
      .data(nodesCopy)
      .join('text')
      .text(d => d.id.slice(0, 12))
      .attr('font-size', d => d.type === 'ring' ? '10px' : '8.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', d => d.type === 'ring' ? '#ff88ff' : d.risk > 70 ? '#ffaa44' : 'rgba(255,255,255,0.7)')
      .attr('font-weight', d => d.type === 'ring' ? '700' : '400')
      .style('pointer-events', 'none')
      .style('display', showLabels ? 'block' : 'none');

    // ---- Tooltip ----
    const tooltip = d3.select('body').select('.node-tooltip').size()
      ? d3.select('body').select('.node-tooltip')
      : d3.select('body').append('div').attr('class', 'node-tooltip');

    // ---- Interactions ----
    nodeEl
      .on('mouseenter', (event, d) => {
        // Highlight connected
        linkEl
          .attr('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05)
          .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? 3.5 : 0.5);

        nodeEl.attr('opacity', n => {
          if (n.id === d.id) return 1;
          return resolvedLinks.some(l =>
            (l.source.id === d.id && l.target.id === n.id) ||
            (l.target.id === d.id && l.source.id === n.id)
          ) ? 1 : 0.15;
        });

        tooltip.style('visibility', 'visible').html(`
          <div class="tooltip-header">
            <span class="tooltip-id">${d.id}</span>
            <span class="tooltip-risk ${d.risk > 80 ? 'critical' : d.risk > 50 ? 'warning' : 'normal'}">${Number(d.risk).toFixed(1)}</span>
          </div>
          <div class="tooltip-body">
            <div class="tooltip-row"><span>Status</span><span>${d.type === 'ring' ? '🔴 RING MEMBER' : d.risk > 70 ? '🟠 HIGH RISK' : d.risk > 40 ? '🟡 WARNING' : '🟢 NORMAL'}</span></div>
            <div class="tooltip-row"><span>In / Out</span><span>${d.inCount} / ${d.outCount}</span></div>
            ${d.ringId ? `<div class="tooltip-row"><span>Ring</span><span>${d.ringId}</span></div>` : ''}
            ${d.patterns.length ? `<div class="tooltip-row"><span>Patterns</span><span>${d.patterns.join(', ')}</span></div>` : ''}
          </div>
        `);
      })
      .on('mousemove', (event) => {
        tooltip.style('top', (event.pageY + 12) + 'px').style('left', (event.pageX + 12) + 'px');
      })
      .on('mouseleave', () => {
        linkEl
          .attr('stroke-opacity', d => {
            const isRingLink = d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId;
            return isRingLink ? 0.85 : 0.4;
          })
          .attr('stroke-width', d => {
            const isRingLink = d.source.ringId && d.target.ringId && d.source.ringId === d.target.ringId;
            if (isRingLink) return 2.5;
            return Math.max(0.8, Math.min(3, Math.log10(d.amount + 1) * 0.7));
          });
        nodeEl.attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeSelect(d);
      });

    linkHitEl
      .on('mouseenter', (event, d) => {
        tooltip.style('visibility', 'visible').html(`
          <div class="tooltip-header"><span class="tooltip-id">Transaction</span></div>
          <div class="tooltip-body">
            <div class="tooltip-row"><span>From</span><span>${d.source.id}</span></div>
            <div class="tooltip-row"><span>To</span><span>${d.target.id}</span></div>
            <div class="tooltip-row"><span>Amount</span><span class="amount">$${Number(d.amount).toLocaleString()}</span></div>
            ${d.id ? `<div class="tooltip-row"><span>TX ID</span><span>${String(d.id).slice(0, 14)}…</span></div>` : ''}
          </div>
        `);
      })
      .on('mousemove', (event) => {
        tooltip.style('top', (event.pageY + 12) + 'px').style('left', (event.pageX + 12) + 'px');
      })
      .on('mouseleave', () => tooltip.style('visibility', 'hidden'));

    svgEl.on('click', () => onNodeSelect(null));

    // ---- Tick ----
    sim.on('tick', () => {
      linkEl
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      linkHitEl
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeEl.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      labelEl
        .attr('x', d => (d.x ?? 0) + nodeRadius(d) + 4)
        .attr('y', d => (d.y ?? 0) + 3);

      // Update ring halo positions to centroid of members
      ringHalos.each(function (rd) {
        const members = nodesCopy.filter(n => n.ringId === rd.ringId);
        if (!members.length) return;
        const cx = d3.mean(members, m => m.x ?? 0);
        const cy = d3.mean(members, m => m.y ?? 0);
        const maxDist = d3.max(members, m => Math.hypot((m.x ?? 0) - cx, (m.y ?? 0) - cy));
        d3.select(this)
          .attr('cx', cx).attr('cy', cy)
          .attr('r', Math.max(50, maxDist + 28));
      });
    });

    return () => {
      sim.stop();
      d3.select('body').selectAll('.node-tooltip').remove();
    };
  }, [displayNodes, displayLinks, showLabels, onNodeSelect, ringMemberMap]);

  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(600).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const togglePhysics = () => {
    if (!simRef.current) return;
    if (physics) simRef.current.stop(); else simRef.current.alphaTarget(0.3).restart();
    setPhysics(p => !p);
  };

  return (
    <div className="graph-wrapper">
      <div className="graph-toolbar">
        <div className="graph-title-section">
          <h3><span className="pulse-dot"></span>NETWORK TOPOLOGY</h3>
          <p>{nodeCount} nodes • {linkCount} links • {ringCount} rings</p>
        </div>
        <div className="graph-controls">
          <button onClick={() => setShowLabels(l => !l)} className={showLabels ? 'active' : ''}>Labels</button>
          <button onClick={togglePhysics} className={physics ? 'active' : ''}>Physics {physics ? 'ON' : 'OFF'}</button>
          <button onClick={resetZoom}><Icons.Refresh /> Reset</button>
        </div>
      </div>

      <div className="graph-main" ref={containerRef}>
        <svg ref={svgRef}></svg>

        <div className="graph-legend">
          <div className="legend-title">Risk Levels</div>
          <div className="legend-item"><span className="dot ring"></span>Ring Member</div>
          <div className="legend-item"><span className="dot high"></span>High Risk &gt;70</div>
          <div className="legend-item"><span className="dot warning"></span>Warning &gt;50</div>
          <div className="legend-item"><span className="dot normal"></span>Normal</div>
          <div className="legend-divider"></div>
          <div className="legend-title">Edges</div>
          <div className="legend-item"><span className="edge-dot" style={{background:'#ff00ff'}}></span>Ring Flow</div>
          <div className="legend-item"><span className="edge-dot" style={{background:'#ff003c'}}></span>&gt;$10k</div>
          <div className="legend-item"><span className="edge-dot" style={{background:'#ffd93d'}}></span>&gt;$1k</div>
          <div className="legend-item"><span className="edge-dot" style={{background:'#00f3ff'}}></span>Normal</div>
        </div>

        {selectedNode && (
          <div className="node-panel">
            <div className="node-panel-header">
              <h4>{selectedNode.id}</h4>
              <button onClick={() => onNodeSelect(null)}><Icons.Close /></button>
            </div>
            <div className="node-panel-body">
              <div className="risk-badge" style={{
                background: selectedNode.risk > 80 ? 'rgba(255,0,60,0.2)' : selectedNode.risk > 50 ? 'rgba(255,217,61,0.2)' : 'rgba(0,243,255,0.2)',
                color: selectedNode.risk > 80 ? '#ff003c' : selectedNode.risk > 50 ? '#ffd93d' : '#00f3ff'
              }}>
                Risk Score: {Number(selectedNode.risk).toFixed(1)}
              </div>
              {selectedNode.ringId && (
                <div className="rings-list">
                  <span>Member of:</span>
                  <span className="ring-tag">{selectedNode.ringId}</span>
                </div>
              )}
              {selectedNode.patterns.length > 0 && (
                <div className="patterns-list">
                  <span>Patterns:</span>
                  {selectedNode.patterns.map(p => <span key={p} className="pattern-tag">{p}</span>)}
                </div>
              )}
              <div className="node-panel-stats">
                <div><span>Incoming</span><strong>{selectedNode.inCount}</strong></div>
                <div><span>Outgoing</span><strong>{selectedNode.outCount}</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="graph-stats">
        <div className="stat"><span className="stat-num">{ringCount}</span><span>Rings</span></div>
        <div className="stat"><span className="stat-num">{displayNodes.filter(n => n.type === 'ring').length}</span><span>Ring Members</span></div>
        <div className="stat"><span className="stat-num">{displayNodes.filter(n => n.risk > 70).length}</span><span>Critical</span></div>
        <div className="stat">
          <span className="stat-num">
            ${(displayLinks.reduce((s, l) => s + (l.amount || 0), 0) / 1_000_000).toFixed(2)}M
          </span>
          <span>Flow</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATS PANEL
// ============================================
const StatsPanel = ({ analysisData, onDownload }) => {
  if (!analysisData) return null;
  const { suspicious_accounts = [], fraud_rings = [], summary = {} } = analysisData;
  const topAccounts = suspicious_accounts.slice(0, 5);
  const patternCounts = {
    cycle: fraud_rings.filter(r => r.pattern_type === 'cycle').length,
    smurfing: suspicious_accounts.filter(a => a.detected_patterns?.includes('smurfing') || a.detected_patterns?.includes('fan_out')).length,
    high_velocity: suspicious_accounts.filter(a => a.detected_patterns?.includes('high_velocity')).length
  };

  return (
    <div className="stats-container">
      <div className="stat-card critical">
        <div className="stat-header">
          <div>
            <div className="stat-big">{summary.suspicious_accounts_flagged ?? suspicious_accounts.length}</div>
            <div className="stat-label">SUSPICIOUS ACCOUNTS</div>
          </div>
          <div className="text-right">
            <div className="stat-big">{summary.fraud_rings_detected ?? fraud_rings.length}</div>
            <div className="stat-label">FRAUD RINGS</div>
          </div>
        </div>
        <div className="threat-bar">
          <div className="threat-fill" style={{ width: `${summary.total_accounts_analyzed ? (suspicious_accounts.length / summary.total_accounts_analyzed) * 100 : 0}%` }}></div>
        </div>
      </div>

      <div className="stat-card">
        <h4>DETECTED PATTERNS</h4>
        <div className="pattern-grid">
          <div className="pattern-box red"><Icons.Ring /><span>Circular</span><strong>{patternCounts.cycle}</strong></div>
          <div className="pattern-box yellow"><Icons.Alert /><span>Smurfing</span><strong>{patternCounts.smurfing}</strong></div>
          <div className="pattern-box purple"><Icons.Ring /><span>High Velocity</span><strong>{patternCounts.high_velocity}</strong></div>
        </div>
      </div>

      <div className="stat-card">
        <h4>TOP RISK ACCOUNTS</h4>
        <div className="risk-list">
          {topAccounts.map((acc, i) => (
            <div key={acc.account_id} className="risk-item">
              <span className="risk-rank">#{i + 1}</span>
              <span className="risk-id">{acc.account_id}</span>
              <span className="risk-score" style={{ color: acc.suspicion_score > 80 ? '#ff003c' : '#ffd93d' }}>
                {Number(acc.suspicion_score).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-card flow-card">
        <h4>ANALYSIS SUMMARY</h4>
        <div className="flow-stat"><span>Total Accounts</span><strong>{summary.total_accounts_analyzed ?? '—'}</strong></div>
        <div className="flow-stat"><span>Total Transactions</span><strong>{summary.total_transactions ?? '—'}</strong></div>
        <div className="flow-stat"><span>Processing Time</span><strong>{summary.processing_time_seconds ?? '—'}s</strong></div>
      </div>

      <div className="stat-card">
        <h4>BACKEND SOURCE</h4>
        <div className="flow-stat"><Icons.Server /><span style={{marginLeft:6, fontSize:'11px', color:'#00f3ff'}}>{API_BASE}</span></div>
      </div>

      <button className="btn-download" onClick={() => onDownload(analysisData)}>
        <Icons.Download /> EXPORT FORENSICS REPORT
      </button>
    </div>
  );
};

// ============================================
// RINGS TABLE
// ============================================
const RingsTable = ({ fraudRings }) => (
  <div className="rings-table-container">
    <div className="table-header">
      <h3>FRAUD RING MANIFEST</h3>
      <span>{fraudRings?.length || 0} rings detected</span>
    </div>
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Ring ID</th><th>Pattern Type</th><th>Members</th><th>Risk Score</th><th>Account IDs</th>
          </tr>
        </thead>
        <tbody>
          {fraudRings?.map(ring => (
            <tr key={ring.ring_id}>
              <td className="mono cyan">{ring.ring_id}</td>
              <td><span className={`badge ${ring.pattern_type}`}>{ring.pattern_type}</span></td>
              <td>{ring.member_accounts?.length}</td>
              <td>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${ring.risk_score}%`, background: ring.risk_score > 90 ? '#ff003c' : '#ffd93d' }}></div>
                  <span>{Number(ring.risk_score).toFixed(1)}</span>
                </div>
              </td>
              <td className="mono small">{ring.member_accounts?.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ============================================
// MAIN APP
// ============================================
const RADIO = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  // ---- Ping backend on mount ----
  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(5000) });
        setBackendStatus(res.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    ping();
  }, []);

  // ---- Upload CSV to backend ----
  const processFile = useCallback(async (file) => {
    setError(null);
    setProcessing(true);
    setProgress(10);
    setMsg('> Connecting to MuleGuard backend...');

    // Animate progress while waiting
    const progressMsgs = [
      [20, '> Uploading CSV to server...'],
      [35, '> Building transaction graph...'],
      [50, '> Running cycle detection...'],
      [65, '> Detecting smurfing patterns...'],
      [75, '> Running anomaly detection...'],
      [85, '> Calculating suspicion scores...'],
      [92, '> Applying dynamic threshold...'],
    ];

    let msgIdx = 0;
    const progressTimer = setInterval(() => {
      if (msgIdx < progressMsgs.length) {
        const [p, m] = progressMsgs[msgIdx];
        setProgress(p);
        setMsg(m);
        msgIdx++;
      }
    }, 600);

    try {
      // Build multipart/form-data — exactly what POST /upload/ expects
      const formData = new FormData();
      formData.append('file', file, file.name);

      const res = await fetch(`${API_BASE}/upload/`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser sets it with correct boundary
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: res.statusText }));
        const detail = typeof errBody.detail === 'object'
          ? JSON.stringify(errBody.detail)
          : errBody.detail || res.statusText;
        throw new Error(`Backend error ${res.status}: ${detail}`);
      }

      const data = await res.json();
      setProgress(98);
      setMsg('> Building graph data...');

      // Backend returns raw_transactions — use them to build nodeMap + links for graph
      const { nodeMap, links } = buildGraphData(data.raw_transactions || []);

      setProgress(100);
      setMsg('> Analysis complete ✓');

      // Small delay for UX
      await new Promise(r => setTimeout(r, 300));

      setAnalysisData({
        suspicious_accounts: data.suspicious_accounts || [],
        fraud_rings: data.fraud_rings || [],
        summary: data.summary || {},
        nodeMap,
        links,
      });

    } catch (err) {
      clearInterval(progressTimer);
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Check backend URL and CORS settings.');
      setBackendStatus('offline');
    } finally {
      setProcessing(false);
    }
  }, []);

  // ---- Download forensics report as JSON ----
  const downloadReport = useCallback((data) => {
    const report = {
      suspicious_accounts: (data.suspicious_accounts || []).map(a => ({
        account_id: String(a.account_id),
        suspicion_score: parseFloat(Number(a.suspicion_score || 0).toFixed(1)),
        detected_patterns: Array.isArray(a.detected_patterns) ? a.detected_patterns : [],
        ring_id: a.ring_id || null,
      })).sort((x, y) => y.suspicion_score - x.suspicion_score),
      fraud_rings: data.fraud_rings || [],
      summary: data.summary || {},
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensics_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const resetApp = () => {
    setAnalysisData(null);
    setError(null);
    setProgress(0);
    setMsg('');
    setSearch('');
    setSelectedNode(null);
  };

  return (
    <div className="radio-app">
      <Navbar searchValue={search} onSearchChange={setSearch} hasData={!!analysisData} backendStatus={backendStatus} />

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      <main className="main">
        {!analysisData ? (
          <>
            <section className="hero">
              <h1>FINANCIAL FORENSICS ENGINE</h1>
              <p>Advanced graph-based money muling detection powered by MuleGuard AI backend</p>
              <Radar />
            </section>
            <section className="upload-section">
              <UploadZone onFile={processFile} processing={processing} backendStatus={backendStatus} />
              {processing && <ProcessingStatus progress={progress} msg={msg} mode="upload" />}
            </section>
          </>
        ) : (
          <>
            <div className="dashboard-header">
              <SearchBar value={search} onChange={setSearch} placeholder="Filter network..." />
              <button className="btn-reset" onClick={resetApp}>↩ New Analysis</button>
            </div>

            <div className="dashboard">
              <div className="dashboard-main">
                <GraphVisualization
                  analysisData={analysisData}
                  searchTerm={search}
                  onNodeSelect={setSelectedNode}
                  selectedNode={selectedNode}
                />
              </div>
              <div className="dashboard-side">
                <StatsPanel analysisData={analysisData} onDownload={downloadReport} />
              </div>
            </div>

            <RingsTable fraudRings={analysisData.fraud_rings} />
          </>
        )}
      </main>
    </div>
  );
};

export default RADIO;
