import { useState, useEffect, useRef, useCallback } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────
function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── GenreMap component ─────────────────────────────────────────────────────
export default function GenreMap() {
  const canvasRef = useRef(null);
  const [genres, setGenres] = useState({});
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation
  const [currentRoot, setCurrentRoot] = useState(null);
  const [navStack, setNavStack] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Panel
  const [activeTab, setActiveTab] = useState("subgenres");
  const [artistTracks, setArtistTracks] = useState(null); // {genreId, artist}

  // Search
  const [search, setSearch] = useState("");

  // Canvas state (mutable refs for pan/zoom to avoid re-renders)
  const stateRef = useRef({
    nodes: [],
    panX: 0, panY: 0, scale: 1,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    hovered: null,
    W: 0, H: 0,
  });
  const animRef = useRef(null);

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const url = import.meta.env.DEV
      ? "/genreMap.json"
      : `${import.meta.env.BASE_URL}genreMap.json`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        setGenres(data.genres);
        setMeta(data.meta);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // ── Build graph nodes ──────────────────────────────────────────────────
  const buildNodes = useCallback((rootId, genreData, W, H) => {
    const ids = rootId === null
      ? Object.keys(genreData).filter((id) => !genreData[id].parent)
      : [rootId, ...(genreData[rootId]?.children || []).filter((c) => genreData[c])];

    if (!ids.length) return [];

    const nodes = [];
    if (rootId === null) {
      const R = Math.min(W, H) * 0.3;
      ids.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
        const g = genreData[id];
        const r = clamp(20 + Math.sqrt(g.trackCount || 0) * 1.1, 24, 64);
        nodes.push({ id, x: R * Math.cos(angle), y: R * Math.sin(angle), r, color: g.color, label: g.name, trackCount: g.trackCount || 0 });
      });
    } else {
      const rootG = genreData[rootId];
      const rootR = clamp(32 + Math.sqrt(rootG.trackCount || 0) * 1.1, 36, 72);
      nodes.push({ id: rootId, x: 0, y: 0, r: rootR, color: rootG.color, label: rootG.name, trackCount: rootG.trackCount || 0, isRoot: true });
      const children = (rootG.children || []).filter((c) => genreData[c]);
      const R = Math.min(W, H) * 0.28;
      children.forEach((cid, i) => {
        const angle = (2 * Math.PI * i) / children.length - Math.PI / 2;
        const g = genreData[cid];
        const r = clamp(14 + Math.sqrt(g.trackCount || 0) * 0.9, 18, 48);
        nodes.push({ id: cid, x: R * Math.cos(angle), y: R * Math.sin(angle), r, color: g.color, label: g.name, trackCount: g.trackCount || 0 });
      });
    }
    return nodes;
  }, []);

  // ── Canvas draw ────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { nodes, panX, panY, scale, hovered, W, H } = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, W * dpr, H * dpr);

    const tx = W / 2 + panX;
    const ty = H / 2 + panY;

    // Subtle grid
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    const gs = 60 * scale;
    const ox = ((panX % gs) + gs) % gs;
    const oy = ((panY % gs) + gs) % gs;
    for (let x = ox - gs + W / 2 - Math.ceil(W / gs) * gs; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = oy - gs + H / 2 - Math.ceil(H / gs) * gs; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // Edges
    ctx.save();
    ctx.translate(tx * dpr, ty * dpr);
    ctx.scale(scale * dpr, scale * dpr);
    const root = nodes.find((n) => n.isRoot);
    if (root) {
      nodes.forEach((n) => {
        if (n.isRoot) return;
        ctx.beginPath();
        ctx.moveTo(root.x, root.y);
        ctx.lineTo(n.x, n.y);
        const gr = ctx.createLinearGradient(root.x, root.y, n.x, n.y);
        gr.addColorStop(0, hexA(root.color, 0.35));
        gr.addColorStop(1, hexA(n.color, 0.12));
        ctx.strokeStyle = gr;
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
      });
    }
    ctx.restore();

    // Nodes
    ctx.save();
    ctx.translate(tx * dpr, ty * dpr);
    ctx.scale(scale * dpr, scale * dpr);
    nodes.forEach((n) => {
      const isHov = hovered === n.id;
      const isSel = stateRef.current.selectedId === n.id;
      const r = isHov ? n.r * 1.08 : n.r;

      if (isHov || isSel) {
        const glow = ctx.createRadialGradient(n.x, n.y, r * 0.4, n.x, n.y, r * 2.4);
        glow.addColorStop(0, hexA(n.color, 0.2));
        glow.addColorStop(1, hexA(n.color, 0));
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.isRoot ? n.color : hexA(n.color, 0.16);
      ctx.fill();
      ctx.strokeStyle = isSel ? "#ffffff" : hexA(n.color, isHov ? 0.9 : 0.55);
      ctx.lineWidth = (isSel ? 2 : 1) / scale;
      ctx.stroke();

      // Arc progress ring
      if (n.trackCount > 0 && !n.isRoot) {
        const maxCount = Math.max(...nodes.map((nn) => nn.trackCount || 0));
        const frac = Math.min(n.trackCount / maxCount, 1);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 4 / scale, -Math.PI / 2, -Math.PI / 2 + frac * 2 * Math.PI);
        ctx.strokeStyle = hexA(n.color, 0.45);
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      // Label
      const bigNode = r * scale > 30;
      const fontSize = clamp(10 / scale, 9, 13);
      ctx.font = `600 ${fontSize}px Syne, Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (bigNode) {
        ctx.fillStyle = n.isRoot ? "rgba(0,0,0,0.85)" : n.color;
        ctx.fillText(n.label, n.x, n.y);
      } else {
        ctx.fillStyle = hexA(n.color, 0.88);
        ctx.fillText(n.label, n.x, n.y + r + 11 / scale);
      }

      // Track count
      if (n.trackCount > 0) {
        ctx.font = `400 ${clamp(8 / scale, 7, 10)}px 'Space Mono', monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        const countY = bigNode ? n.y + 13 / scale : n.y + r + 21 / scale;
        ctx.fillText(n.trackCount, n.x, countY);
      }
    });
    ctx.restore();
  }, []);

  // ── Resize ─────────────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    stateRef.current.W = W;
    stateRef.current.H = H;
    draw();
  }, [draw]);

  // ── Rebuild graph when root changes ───────────────────────────────────
  useEffect(() => {
    if (!Object.keys(genres).length) return;
    const { W, H } = stateRef.current;
    const nodes = buildNodes(currentRoot, genres, W || 600, H || 400);
    stateRef.current.nodes = nodes;
    stateRef.current.panX = 0;
    stateRef.current.panY = 0;
    stateRef.current.scale = 1;
    stateRef.current.hovered = null;
    draw();
  }, [currentRoot, genres, buildNodes, draw]);

  // ── Canvas setup & events ─────────────────────────────────────────────
  useEffect(() => {
    if (loading || !canvasRef.current) return;
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [loading, resize]);

  const worldToLocal = (ex, ey) => {
    const { panX, panY, scale, W, H } = stateRef.current;
    return { x: (ex - W / 2 - panX) / scale, y: (ey - H / 2 - panY) / scale };
  };

  const hitNode = (ex, ey) => {
    const { x, y } = worldToLocal(ex, ey);
    return stateRef.current.nodes.find((n) => {
      const dx = n.x - x, dy = n.y - y;
      return dx * dx + dy * dy <= n.r * n.r;
    });
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const n = hitNode(e.clientX - rect.left, e.clientY - rect.top);
    if (n) {
      stateRef.current.selectedId = n.id;
      setSelectedId(n.id);
      setActiveTab("subgenres");
      setArtistTracks(null);
      draw();
    } else {
      stateRef.current.isDragging = true;
      stateRef.current.dragStart = { x: e.clientX, y: e.clientY };
      stateRef.current.panStart = { x: stateRef.current.panX, y: stateRef.current.panY };
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;
    if (stateRef.current.isDragging) {
      stateRef.current.panX = stateRef.current.panStart.x + (e.clientX - stateRef.current.dragStart.x);
      stateRef.current.panY = stateRef.current.panStart.y + (e.clientY - stateRef.current.dragStart.y);
      draw();
      return;
    }
    const n = hitNode(lx, ly);
    const newH = n ? n.id : null;
    if (newH !== stateRef.current.hovered) {
      stateRef.current.hovered = newH;
      canvasRef.current.style.cursor = newH ? "pointer" : "grab";
      draw();
    }
  };

  const handleMouseUp = () => { stateRef.current.isDragging = false; };

  const handleDblClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const n = hitNode(e.clientX - rect.left, e.clientY - rect.top);
    if (n && genres[n.id]?.children?.length) {
      setNavStack((prev) => [...prev, currentRoot]);
      setCurrentRoot(n.id);
      setSelectedId(n.id);
      setActiveTab("subgenres");
      setArtistTracks(null);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left - stateRef.current.W / 2;
    const cy = e.clientY - rect.top - stateRef.current.H / 2;
    stateRef.current.panX = cx + (stateRef.current.panX - cx) * factor;
    stateRef.current.panY = cy + (stateRef.current.panY - cy) * factor;
    stateRef.current.scale = clamp(stateRef.current.scale * factor, 0.12, 6);
    draw();
  };

  const zoom = (f) => {
    stateRef.current.scale = clamp(stateRef.current.scale * f, 0.12, 6);
    draw();
  };

  const resetView = () => {
    stateRef.current.panX = 0;
    stateRef.current.panY = 0;
    stateRef.current.scale = 1;
    draw();
  };

  const navigateBack = () => {
    if (!navStack.length) return;
    const prev = navStack[navStack.length - 1];
    setNavStack((s) => s.slice(0, -1));
    setCurrentRoot(prev);
    setSelectedId(prev);
    setActiveTab("subgenres");
    setArtistTracks(null);
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalArtists = Object.values(genres).reduce((s, g) => s + (g.artistCount || 0), 0);

  // ── Panel content ─────────────────────────────────────────────────────
  const selGenre = selectedId ? genres[selectedId] : null;

  const renderSubgenres = (g) => {
    const kids = (g.children || []).filter((c) => genres[c]);
    if (!kids.length) return <div style={styles.emptyState}>No sub-genres yet.<br />Double-click a node to zoom in.</div>;
    return (
      <div style={styles.chipList}>
        {kids.map((cid) => {
          const cg = genres[cid];
          return (
            <div
              key={cid}
              style={{ ...styles.chip, background: hexA(cg.color, 0.13), color: cg.color, borderColor: hexA(cg.color, 0.35) }}
              onClick={() => {
                setNavStack((prev) => [...prev, currentRoot]);
                setCurrentRoot(cid);
                setSelectedId(cid);
                setActiveTab("subgenres");
                setArtistTracks(null);
              }}
            >
              {cg.name}{cg.trackCount ? ` · ${cg.trackCount}` : ""}
            </div>
          );
        })}
      </div>
    );
  };

  const renderArtists = (g) => {
    if (!g.artists?.length) return <div style={styles.emptyState}>No artists found.</div>;
    return g.artists.map((a, i) => {
      const initials = a.name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
      return (
        <div key={a.name} style={styles.artistRow} onClick={() => setArtistTracks({ genreId: selectedId, artist: a })}>
          <div style={{ ...styles.avatar, background: hexA(g.color, 0.15), color: g.color }}>{initials}</div>
          <div style={styles.artistInfo}>
            <div style={styles.artistName}>{a.name}</div>
            <div style={styles.artistSub}>{a.trackCount} track{a.trackCount !== 1 ? "s" : ""}</div>
          </div>
          <div style={styles.badge}>#{i + 1}</div>
        </div>
      );
    });
  };

  const renderTracks = (g) => {
    const all = (g.artists || []).flatMap((a) => a.tracks.map((t) => ({ ...t, artistName: a.name })));
    all.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return (
      <>
        {all.slice(0, 200).map((t, i) => (
          <div key={t.id || i} style={styles.trackRow}>
            <div style={styles.trackNum}>{i + 1}</div>
            <div style={styles.trackInfo}>
              <div style={styles.trackTitle}>{t.title}</div>
              <div style={styles.trackSub}>{t.artistName}{t.album ? ` · ${t.album}` : ""}</div>
            </div>
            <div style={styles.trackBpm}>{t.bpm ? `${t.bpm}bpm` : ""}</div>
          </div>
        ))}
        {all.length > 200 && <div style={styles.emptyState}>… and {all.length - 200} more</div>}
      </>
    );
  };

  // ── Breadcrumb ────────────────────────────────────────────────────────
  const crumbs = [];
  navStack.forEach((id, i) => {
    if (id !== null && genres[id]) crumbs.push({ id, label: genres[id].name, stackIdx: i });
  });

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>Loading Genre Map…</div>
        <div style={styles.loadingBar}><div style={styles.loadingFill} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>⚠ Could not load genreMap.json</div>
        <div style={{ color: "#a8896c", fontSize: 12, marginTop: 8 }}>{error}</div>
        <div style={{ color: "#7a6450", fontSize: 11, marginTop: 4 }}>Make sure genreMap.json is in the /public folder.</div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* ── Canvas area ── */}
      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDblClick}
          onWheel={handleWheel}
        />

        {/* Search */}
        <input
          style={styles.search}
          placeholder="Search genres…"
          value={search}
          onChange={(e) => {
            const q = e.target.value.toLowerCase();
            setSearch(e.target.value);
            if (!q) return;
            const match = Object.keys(genres).find((id) => genres[id].name.toLowerCase().includes(q));
            if (match && genres[match].parent) {
              // Navigate to parent so node is visible
              setNavStack([null]);
              setCurrentRoot(genres[match].parent);
              setSelectedId(match);
              stateRef.current.selectedId = match;
              setActiveTab("subgenres");
            }
          }}
        />

        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <span style={styles.crumb} onClick={() => { setNavStack([]); setCurrentRoot(null); setSelectedId(null); }}>All Genres</span>
          {crumbs.map((c) => (
            <span key={c.id}>
              <span style={styles.bcSep}>›</span>
              <span style={styles.crumb} onClick={() => {
                setNavStack((s) => s.slice(0, c.stackIdx + 1));
                setCurrentRoot(c.id);
                setSelectedId(c.id);
              }}>{c.label}</span>
            </span>
          ))}
          {currentRoot && genres[currentRoot] && (
            <span><span style={styles.bcSep}>›</span><span style={{ ...styles.crumb, color: "#d4a96a" }}>{genres[currentRoot].name}</span></span>
          )}
        </div>

        {/* Zoom controls */}
        <div style={styles.zoomControls}>
          <button style={styles.zoomBtn} onClick={() => zoom(1.25)}>+</button>
          <button style={styles.zoomBtn} onClick={() => zoom(0.8)}>−</button>
          <button style={{ ...styles.zoomBtn, fontSize: 12 }} onClick={resetView} title="Reset view">⌂</button>
        </div>

        {/* Stats bar */}
        <div style={styles.statsBar}>
          <span>Genres <strong style={{ color: "#e8d5b0" }}>{meta.total_genres}</strong></span>
          <span>Tracks <strong style={{ color: "#e8d5b0" }}>{(meta.mapped_tracks || 0).toLocaleString()}</strong></span>
        </div>

        {/* Hint */}
        {!selectedId && (
          <div style={styles.hint}>Click a node to explore · Double-click to drill in</div>
        )}
      </div>

      {/* ── Side Panel ── */}
      <div style={styles.panel}>
        {/* Back */}
        {navStack.length > 0 && (
          <div style={styles.panelBack} onClick={navigateBack}>
            ‹ Back
          </div>
        )}

        {selGenre ? (
          <>
            {/* Header */}
            <div style={styles.panelHeader}>
              <div style={{ ...styles.panelGenreName, color: selGenre.color }}>{selGenre.name}</div>
              <div style={styles.panelMeta}>
                <div><strong style={styles.statVal}>{selGenre.trackCount}</strong><br />tracks</div>
                <div><strong style={styles.statVal}>{selGenre.artistCount}</strong><br />artists</div>
                <div><strong style={styles.statVal}>{(selGenre.children || []).length}</strong><br />sub-genres</div>
              </div>
            </div>
            <div style={styles.panelDesc}>{selGenre.desc}</div>

            {/* Tabs */}
            <div style={styles.tabs}>
              {["subgenres", "artists", "tracks"].map((t) => (
                <button
                  key={t}
                  style={{ ...styles.tabBtn, ...(activeTab === t ? styles.tabActive : {}) }}
                  onClick={() => { setActiveTab(t); setArtistTracks(null); }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Panel body */}
            <div style={styles.panelBody}>
              {artistTracks ? (
                <>
                  <div style={styles.panelBack} onClick={() => setArtistTracks(null)}>‹ {artistTracks.artist.name}</div>
                  {artistTracks.artist.tracks.map((t, i) => (
                    <div key={t.id || i} style={styles.trackRow}>
                      <div style={styles.trackNum}>{i + 1}</div>
                      <div style={styles.trackInfo}>
                        <div style={styles.trackTitle}>{t.title}</div>
                        <div style={styles.trackSub}>{t.album || ""}{t.year ? ` · ${t.year}` : ""}</div>
                      </div>
                      <div style={styles.trackBpm}>{t.bpm ? `${t.bpm}bpm` : ""}</div>
                    </div>
                  ))}
                </>
              ) : activeTab === "subgenres" ? renderSubgenres(selGenre)
                : activeTab === "artists" ? renderArtists(selGenre)
                : renderTracks(selGenre)}
            </div>
          </>
        ) : (
          <div style={styles.panelEmpty}>
            <div style={styles.panelEmptyIcon}>◎</div>
            <div>Click any node to explore genres, artists and tracks</div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>Double-click to drill into sub-genres</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  root: {
    display: "flex",
    height: "calc(100vh - 180px)",
    minHeight: 480,
    background: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    position: "relative",
  },
  canvasWrap: { flex: 1, position: "relative", overflow: "hidden" },
  canvas: { width: "100%", height: "100%", cursor: "grab", display: "block" },

  search: {
    position: "absolute", top: 14, left: 14,
    width: 200, padding: "7px 12px",
    background: "rgba(30,20,10,0.8)", border: "1px solid rgba(180,140,80,0.25)",
    borderRadius: 6, color: "#e8d5b0", fontSize: 12,
    fontFamily: "'Space Mono', monospace", outline: "none",
  },

  breadcrumb: {
    position: "absolute", top: 16, left: 228,
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 12, fontFamily: "'Space Mono', monospace",
  },
  crumb: { color: "#c4a87a", cursor: "pointer", transition: "color .15s" },
  bcSep: { color: "rgba(255,255,255,0.25)", margin: "0 2px" },

  zoomControls: {
    position: "absolute", bottom: 44, left: 14,
    display: "flex", flexDirection: "column", gap: 4,
  },
  zoomBtn: {
    width: 30, height: 30,
    background: "rgba(30,20,10,0.75)", border: "1px solid rgba(180,140,80,0.2)",
    borderRadius: 4, color: "#e8d5b0", fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  statsBar: {
    position: "absolute", bottom: 14, left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(20,12,4,0.7)", border: "1px solid rgba(180,140,80,0.15)",
    borderRadius: 6, padding: "5px 18px",
    display: "flex", gap: 18, alignItems: "center",
    fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8a7060",
    pointerEvents: "none",
  },

  hint: {
    position: "absolute", bottom: 14, right: 14,
    fontSize: 11, fontFamily: "'Space Mono', monospace",
    color: "rgba(180,140,80,0.4)", pointerEvents: "none",
  },

  // Panel
  panel: {
    width: 320, flexShrink: 0,
    background: "rgba(20,12,4,0.75)",
    borderLeft: "1px solid rgba(180,140,80,0.12)",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  panelBack: {
    padding: "10px 18px", fontSize: 12,
    fontFamily: "'Space Mono', monospace", color: "#a8896c",
    cursor: "pointer", borderBottom: "1px solid rgba(180,140,80,0.1)",
    flexShrink: 0, transition: "color .12s",
  },
  panelHeader: {
    padding: "18px 18px 12px",
    borderBottom: "1px solid rgba(180,140,80,0.1)", flexShrink: 0,
  },
  panelGenreName: { fontSize: 20, fontWeight: 800, marginBottom: 10, lineHeight: 1.1 },
  panelMeta: {
    display: "flex", gap: 20,
    fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#8a7060",
  },
  statVal: { fontSize: 16, color: "#e8d5b0", display: "block" },
  panelDesc: {
    padding: "12px 18px", fontSize: 12, lineHeight: 1.6,
    color: "#8a7060", borderBottom: "1px solid rgba(180,140,80,0.1)", flexShrink: 0,
  },
  tabs: { display: "flex", borderBottom: "1px solid rgba(180,140,80,0.1)", flexShrink: 0 },
  tabBtn: {
    flex: 1, padding: "9px 0",
    fontFamily: "'Space Mono', monospace", fontSize: 10,
    letterSpacing: "0.1em", textTransform: "uppercase",
    background: "none", border: "none",
    color: "#6a5a4a", cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: { color: "#d4a96a", borderBottomColor: "#d4a96a" },
  panelBody: { flex: 1, overflowY: "auto" },
  panelEmpty: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: 32,
    fontSize: 13, color: "#6a5a4a", lineHeight: 1.7,
  },
  panelEmptyIcon: { fontSize: 36, marginBottom: 16, color: "#4a3820" },

  // Chips
  chipList: { display: "flex", flexWrap: "wrap", gap: 6, padding: "14px 18px" },
  chip: {
    fontSize: 11, fontFamily: "'Space Mono', monospace",
    padding: "4px 10px", borderRadius: 4, cursor: "pointer",
    border: "1px solid", transition: "opacity .12s, transform .1s",
  },

  // Artists
  artistRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 18px", cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background .1s",
  },
  avatar: {
    width: 30, height: 30, borderRadius: 4, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono', monospace",
  },
  artistInfo: { flex: 1, minWidth: 0 },
  artistName: { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e8d5b0" },
  artistSub: { fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#6a5a4a" },
  badge: {
    fontSize: 10, fontFamily: "'Space Mono', monospace",
    padding: "2px 6px", background: "rgba(255,255,255,0.05)",
    borderRadius: 3, color: "#6a5a4a", flexShrink: 0,
  },

  // Tracks
  trackRow: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "7px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  trackNum: { fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#4a3a2a", width: 18, textAlign: "right", flexShrink: 0 },
  trackInfo: { flex: 1, minWidth: 0 },
  trackTitle: { fontSize: 12, color: "#d4c4a8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  trackSub: { fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#6a5a4a" },
  trackBpm: { fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#6a5a4a", flexShrink: 0 },

  emptyState: {
    padding: "32px 18px", textAlign: "center",
    fontSize: 12, fontFamily: "'Space Mono', monospace",
    color: "#5a4a3a", lineHeight: 1.8,
  },

  // Loading
  loadingWrap: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: 400, gap: 14,
  },
  loadingText: {
    fontFamily: "'Space Mono', monospace", fontSize: 12,
    color: "#8a7060", letterSpacing: "0.15em",
  },
  loadingBar: {
    width: 200, height: 2,
    background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden",
  },
  loadingFill: {
    height: "100%", background: "#c4a86a",
    animation: "gmLoad 1.4s ease-in-out infinite",
  },
};
