// New feature screens: Home Hub, Zone Out, Quiet Map, Find Stella Users, Chat
const { useEffect, useRef, useState, useCallback, useMemo } = React;

/* ----------------------- Shared icons ----------------------- */
const IcCompanion = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c0-5 4-9 9-9s9 4 9 9c0 3.5-2 6.5-5 8l-1 3-3-1c-5 0-9-4-9-10z"/>
    <circle cx="9" cy="11" r="1.2" fill="currentColor"/>
    <circle cx="15" cy="11" r="1.2" fill="currentColor"/>
    <path d="M9.5 14.5c1 1 4 1 5 0"/>
  </svg>
);
const IcHeadphones = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3v5zM3 19a2 2 0 0 0 2 2h1v-7H3v5z"/>
  </svg>
);
const IcMapPin = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcUsers = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcMsg = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);
const IcCam = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IcHome = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>
  </svg>
);
const IcPlay = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>
);
const IcPause = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);
const IcSend = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcWave = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c0-2 2-4 4-4s4 2 4 4v6m0-6c0-2 2-4 4-4s4 2 4 4v3"/>
    <path d="M11 18c0 2-2 3-4 3s-4-1-4-3"/>
  </svg>
);
const IcEye = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/* ----------------------- Bottom dock ----------------------- */
function Dock({ active, onNav, onAR }) {
  return (
    <div className="dock">
      <button className={`dock-item ${active === "home" ? "active" : ""}`} onClick={() => onNav("home")}>
        <IcHome /><span>Home</span>
      </button>
      <button className={`dock-item ${active === "map" ? "active" : ""}`} onClick={() => onNav("map")}>
        <IcMapPin /><span>Map</span>
      </button>
      <button className="dock-center" onClick={onAR} aria-label="AR Companion">
        <div className="ring" />
        <IcCam />
      </button>
      <button className={`dock-item ${active === "chat" ? "active" : ""}`} onClick={() => onNav("chat")}>
        <IcMsg /><span>Chat</span>
      </button>
      <button className={`dock-item ${active === "zone" ? "active" : ""}`} onClick={() => onNav("zone")}>
        <IcHeadphones /><span>Zone</span>
      </button>
    </div>
  );
}

/* ----------------------- Floating ambient Stella ----------------------- */
function AmbientStella({ variant, onClick }) {
  return (
    <button className="ambient-stella" onClick={onClick} aria-label="Open chat with Stella">
      <StellaMini variant={variant} size={40} />
    </button>
  );
}

/* ----------------------- Home Hub ----------------------- */
const STATUSES = [
  { id: "social", label: "Feeling social", color: "#5cd9a3" },
  { id: "neutral", label: "Just here", color: "#ffd66a" },
  { id: "quiet", label: "Need quiet", color: "#a3b8ff" },
  { id: "wobbly", label: "A bit wobbly", color: "#ff9aa8" },
  { id: "invisible", label: "Please don't notice me", color: "#b6b6c8" },
];

function HomeScreen({ variant, name, status, setStatus, onNav, onAR, onChat }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentStatus = STATUSES.find((s) => s.id === status) || STATUSES[0];

  return (
    <div className="screen home" data-screen-label="03 Home Hub">
      <div className="home-header">
        <h1 className="home-greeting">So good to see you again, {name}!</h1>
        <div className="home-avatar">M</div>
      </div>

      <div className="home-stella">
        <Stella variant={variant} size={110} mode="idle" />
      </div>

      <div className="home-status">
        <span className="led" />
        Connected to AR glasses
      </div>

      <div className="status-row" style={{ position: "relative" }}>
        <span className="label">Status</span>
        <button className="status-pill" onClick={() => setMenuOpen((o) => !o)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: currentStatus.color, display: "inline-block" }} />
            {currentStatus.label}
          </span>
          <span className="chev">⌄</span>
        </button>
        <button className="ghost-icon" onClick={() => setStatus("invisible")} aria-label="Go invisible">
          <IcEye />
        </button>
        {menuOpen && (
          <div className="status-menu">
            {STATUSES.map((s) => (
              <button key={s.id} onClick={() => { setStatus(s.id); setMenuOpen(false); }}>
                <span className="swatch" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tiles">
        <button className="tile tile-ar span2" onClick={onAR} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="tile-title">Conversation starters</div>
            <div className="tile-sub">Stella sees a group, soft way in?</div>
          </div>
          <img src="assets/stella-conversation.png" alt="" style={{ width: 96, height: 96, filter: "drop-shadow(0 4px 10px rgba(0, 80, 110, 0.2))", flexShrink: 0 }} />
        </button>

        <button className="tile tile-zone" onClick={() => onNav("zone")}>
          <div className="tile-art">
            <div className="icon-art" style={{ background: "rgba(255,255,255,0.7)" }}>
              <IcHeadphones stroke="#3a4f9b" />
            </div>
          </div>
          <div className="tile-title">Zone out</div>
          <div className="tile-sub">Music, quiet, breathing</div>
        </button>

        <button className="tile tile-map" onClick={() => onNav("map")}>
          <div className="tile-art">
            <div className="map-mini" />
          </div>
          <div className="tile-title">Quiet map</div>
          <div className="tile-sub">Where the calm corners are</div>
        </button>

        <button className="tile tile-find" onClick={() => onNav("findusers")}>
          <div className="tile-art">
            <div className="icon-art" style={{ background: "rgba(255,255,255,0.7)" }}>
              <IcUsers stroke="#8a6014" />
            </div>
          </div>
          <div className="tile-title">Find friends</div>
          <div className="tile-sub">Other Stellas, nearby</div>
        </button>

        <button className="tile tile-chat" onClick={onChat}>
          <div className="tile-art">
            <div className="icon-art" style={{ background: "rgba(255,255,255,0.7)" }}>
              <IcMsg stroke="#5a4ba8" />
            </div>
          </div>
          <div className="tile-title">Chat with Stella</div>
          <div className="tile-sub">Just to talk</div>
        </button>
      </div>
    </div>
  );
}

/* ----------------------- Zone Out ----------------------- */
const TRACKS = [
  { id: "rain", name: "Rain on a tin roof", artist: "Ambient · Stella picks" },
  { id: "library", name: "Library hum", artist: "Soft loop" },
  { id: "river", name: "Brisbane river breeze", artist: "Outdoor textures" },
  { id: "piano", name: "One-note piano", artist: "Slow keys" },
];

const AMBIENTS = ["Rain", "Library hum", "River", "Crowd, faint", "Wind through trees", "Lo-fi", "Silence"];

function ZoneScreen({ variant, onBack }) {
  const [playing, setPlaying] = useState(true);
  const [track, setTrack] = useState(0);
  const [noiseCancel, setNoiseCancel] = useState(true);
  const [stellaShield, setStellaShield] = useState(true);
  const [ambient, setAmbient] = useState("Rain");

  const t = TRACKS[track];

  return (
    <div className="screen zone" data-screen-label="04 Zone Out">
      <div className="s-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="s-title">Zone out</h2>
      </div>

      <div className="zone-body">
        <div className="breath-orb">
          <div className="ring" />
          <div className="ring delayed" />
          <div className="ring delayed2" />
          <div className="core" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <Stella variant={variant} size={120} mode="reassuring" />
          </div>
        </div>
        <div className="breath-label">Breathe with me</div>

        <div className="zone-controls">
          <div className="now-playing">
            <div className="album"><IcHeadphones stroke={undefined} /></div>
            <div className="meta">
              <div className="track">{t.name}</div>
              <div className="artist">{t.artist}</div>
            </div>
            <button className="play-btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? <IcPause /> : <IcPlay />}
            </button>
          </div>

          <div className="ambient-list">
            {AMBIENTS.map((a) => (
              <button
                key={a}
                className={`ambient-chip ${ambient === a ? "active" : ""}`}
                onClick={() => setAmbient(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="toggle-row">
            <div className="toggle-text">
              <div className="toggle-name">Cancel the world</div>
              <div className="toggle-hint">Soft noise cancellation through your earphones.</div>
            </div>
            <button className={`switch ${noiseCancel ? "on" : ""}`} onClick={() => setNoiseCancel((s) => !s)} aria-label="Toggle noise cancellation" />
          </div>

          <div className="toggle-row">
            <div className="toggle-text">
              <div className="toggle-name">Stella shield</div>
              <div className="toggle-hint">She softly dims notifications and conversations for the next 20 minutes.</div>
            </div>
            <button className={`switch ${stellaShield ? "on" : ""}`} onClick={() => setStellaShield((s) => !s)} aria-label="Toggle Stella shield" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Quiet Map ----------------------- */
const SPOTS = [
  { id: "library-cafe", name: "Library cafe", kind: "cafe", status: "quiet", x: 22, y: 24, count: 3, blurb: "Soft chairs by the window. Two Stellas reading." },
  { id: "z9-commons", name: "Z9 study commons", kind: "study", status: "medium", x: 60, y: 18, count: 14, blurb: "Almost half full. Quiet zone at the back." },
  { id: "courtyard", name: "P-block courtyard", kind: "outdoor", status: "quiet", x: 38, y: 50, count: 5, blurb: "Birds, no music. Bench under the jacaranda is open." },
  { id: "lecture-back", name: "QE2 lecture theatre", kind: "study", status: "busy", x: 72, y: 42, count: 80, blurb: "Filling up fast for 10am. Back row still has gaps." },
  { id: "food-court", name: "GP food court", kind: "cafe", status: "busy", x: 18, y: 65, count: 60, blurb: "Loud. The edge tables near the door are calmest." },
  { id: "lawn", name: "Old Government House lawn", kind: "outdoor", status: "quiet", x: 50, y: 82, count: 2, blurb: "Open grass, slow river breeze." },
  { id: "design-studio", name: "Design studio couch", kind: "study", status: "quiet", x: 78, y: 70, count: 1, blurb: "One Stella sketching. Plenty of space." },
  { id: "stella-meet", name: "Stella by the lawn", kind: "stella", status: "quiet", x: 44, y: 70, count: 1, blurb: "Another Stella user nearby, marked available." },
];

const FILTERS = [
  { id: "all", label: "Everywhere" },
  { id: "quiet", label: "Quiet only", swatch: "#9cd99a" },
  { id: "stella", label: "Stellas nearby", swatch: "#96deeb" },
  { id: "cafe", label: "Cafe" },
  { id: "study", label: "Study" },
  { id: "outdoor", label: "Outdoors" },
];

function MapScreen({ variant, onBack, onAR, onFindUsers }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = SPOTS.filter((s) => {
    if (filter === "all") return true;
    if (filter === "quiet") return s.status === "quiet";
    if (filter === "stella") return s.kind === "stella";
    return s.kind === filter;
  });

  const sel = SPOTS.find((s) => s.id === selected);
  const showStellaCTA = filter === "stella" || filter === "all";

  return (
    <div className="screen qmap" data-screen-label="05 Quiet Map">
      <div className="s-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="s-title">Quiet map</h2>
        {showStellaCTA && (
          <button
            className="pill"
            style={{ fontSize: 12, padding: "8px 14px", background: "rgba(255,255,255,0.85)" }}
            onClick={onFindUsers}
          >
            <IcCam style={{ width: 14, height: 14, marginRight: 6 }} /> Scan
          </button>
        )}
      </div>

      <div className="qmap-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`qmap-filter ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.swatch && <span className="swatch" style={{ background: f.swatch }} />}
            {f.label}
          </button>
        ))}
      </div>

      <div className="qmap-canvas">
        <img className="base" src="assets/campus-map.png" alt="Campus map" />

        {filtered.map((s) => {
          const size = s.kind === "stella" ? 30 : 24 + Math.min(28, Math.log2(s.count + 1) * 8);
          return (
            <button
              key={s.id}
              className={`qmap-bubble ${s.kind === "stella" ? "stella" : s.status}`}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => setSelected(s.id)}
              aria-label={s.name}
            >
              {s.kind === "stella" ? "✦" : s.count}
            </button>
          );
        })}

        <div className="qmap-legend" style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(255,255,255,0.85)", borderRadius: 14, padding: "6px 10px", justifyContent: "space-between" }}>
          <div className="item"><span className="dot" style={{ background: "#9cd99a" }} /> Quiet</div>
          <div className="item"><span className="dot" style={{ background: "#f0b450" }} /> Filling</div>
          <div className="item"><span className="dot" style={{ background: "#e67878" }} /> Busy</div>
          <div className="item"><span className="dot" style={{ background: "#96deeb" }} /> Stella</div>
        </div>
      </div>

      <div className={`spot-card ${sel ? "open" : ""}`} style={{ bottom: 100 }}>
        {sel && (
          <>
            <div className="head">
              <div>
                <p className="name">{sel.name}</p>
                <p style={{ margin: "2px 0 0", fontFamily: "Imprima, sans-serif", fontSize: 12, opacity: 0.7 }}>
                  {sel.count} {sel.count === 1 ? "person" : "people"} here now
                </p>
              </div>
              <div className={`status ${sel.status}`}>
                <span className="dot" />
                {sel.status === "quiet" ? "Quiet" : sel.status === "medium" ? "Filling" : "Busy"}
              </div>
            </div>
            <p>{sel.blurb}</p>
            <div className="row">
              <button className="pill" onClick={() => setSelected(null)}>Maybe later</button>
              {sel.kind === "stella" ? (
                <button className="pill pill-primary" onClick={() => { setSelected(null); onFindUsers(); }}>
                  <IcCam style={{ width: 14, height: 14, marginRight: 6 }} /> Switch to camera
                </button>
              ) : (
                <button className="pill pill-primary" onClick={() => { setSelected(null); onAR(); }}>
                  Take me there
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------- Find Stella Users (camera + halos) ----------------------- */
const NEARBY_STELLAS = [
  { id: "u1", name: "Sam", variant: "blob", x: 26, y: 38, mood: "Quiet, open to a chat", note: "Sketching alone. Said hi to two people today." },
  { id: "u2", name: "Priya", variant: "bear", x: 60, y: 32, mood: "Feeling social", note: "Looking for a study buddy for INB101." },
  { id: "u3", name: "Jay", variant: "ghost", x: 72, y: 56, mood: "Wobbly today", note: "Would love a gentle wave. No pressure." },
];

function FindUsersScreen({ variant, onBack, onChat }) {
  const videoRef = useRef(null);
  const [camOn, setCamOn] = useState(false);
  const [permState, setPermState] = useState("ask"); // ask | loading | granted | denied
  const [selected, setSelected] = useState(null);
  const [waved, setWaved] = useState({});

  const start = async () => {
    setPermState("loading");
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermState("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
      setPermState("granted");
    } catch (e) {
      setPermState("denied");
    }
  };

  useEffect(() => {
    return () => {
      const s = videoRef.current?.srcObject;
      if (s?.getTracks) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const sel = NEARBY_STELLAS.find((u) => u.id === selected);

  return (
    <div className="screen ar-view" data-screen-label="06 Find Stella Users">
      {camOn ? (
        <video ref={videoRef} className="ar-camera" playsInline muted autoPlay />
      ) : (
        <div className="ar-fallback-bg" />
      )}
      <div className="ar-grain" />
      <div className="ar-vignette" />

      {/* Top back */}
      <div className="ar-top-actions" style={{ left: 14, right: "auto" }}>
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
      </div>

      <div className="scan-status">
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#96deeb", boxShadow: "0 0 6px #96deeb" }} />
        Scanning for Stellas, gently
      </div>

      <div className="scan-corner tl" />
      <div className="scan-corner tr" />
      <div className="scan-corner bl" />
      <div className="scan-corner br" />
      <div className="scan-overlay">
        <div className="scan-line" />
      </div>

      {/* Permission card */}
      {permState === "ask" && (
        <div className="permission-card">
          <h3>Look for nearby Stellas?</h3>
          <p>
            Stella will quietly scan the area for other students using Stella who have marked themselves available. Nothing is recorded. You can say no.
          </p>
          <div className="actions">
            <button className="pill-ghost pill" onClick={onBack}>Not now</button>
            <button className="pill pill-primary" onClick={start}>Yes please</button>
          </div>
        </div>
      )}
      {permState === "denied" && (
        <div className="permission-card">
          <h3>That's okay</h3>
          <p>
            Without the camera, Stella will show a soft view instead. Some Stellas may still be visible in this area.
          </p>
          <div className="actions">
            <button className="pill pill-primary" onClick={() => setPermState("granted")}>Continue without camera</button>
          </div>
        </div>
      )}

      {/* Halos over nearby Stellas */}
      {(permState === "granted" || permState === "denied") && permState !== "ask" && (permState === "granted" ? camOn || true : true) && permState !== "loading" && (
        <>
          {NEARBY_STELLAS.map((u) => (
            <button
              key={u.id}
              className="user-halo"
              style={{ left: `${u.x}%`, top: `${u.y}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => setSelected(u.id)}
            >
              <div className="silhouette" />
              <div className="available-tag">{u.name} · available</div>
            </button>
          ))}
        </>
      )}

      {/* User sheet */}
      <div className={`user-sheet ${sel ? "open" : ""}`}>
        {sel && (
          <>
            <div className="top">
              <div className="avatar">
                <StellaMini variant={sel.variant} size={56} />
              </div>
              <div>
                <p className="who">{sel.name}</p>
                <p className="mood">{sel.mood}</p>
              </div>
            </div>
            <div className="note">{sel.note}</div>
            <div className="actions">
              <button className="pill" onClick={() => setSelected(null)}>Give space</button>
              {waved[sel.id] ? (
                <button className="pill pill-primary" onClick={() => { setSelected(null); onChat(); }}>
                  Open chat
                </button>
              ) : (
                <button className="pill pill-primary" onClick={() => setWaved((w) => ({ ...w, [sel.id]: true }))}>
                  <IcWave style={{ width: 16, height: 16, marginRight: 6 }} /> Wave gently
                </button>
              )}
            </div>
            {waved[sel.id] && (
              <p style={{ margin: "10px 0 0", fontFamily: "Indie Flower, cursive", fontSize: 15, color: "var(--navy)", opacity: 0.8, textAlign: "center" }}>
                {sel.name} waved back. 🫧
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------- Chat with Stella ----------------------- */
const CHAT_SUGGESTIONS = [
  "I'm nervous about tomorrow",
  "Tell me something soft",
  "I feel invisible today",
  "How do I start a conversation",
  "I want to leave the lecture",
];

function ChatScreen({ variant, name, onBack, apiKey }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("stella.chat") || "null");
      if (saved && Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return [
      { role: "assistant", content: `Hi ${name}. No rush. Want to tell me something small, or sit here a moment?` },
    ];
  });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("stella.chat", JSON.stringify(messages));
    // scroll to bottom
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || pending) return;
    setInput("");
    const next = [...messages, { role: "user", content: t }];
    setMessages(next);
    setPending(true);
    try {
      const { text: reply } = await chatStella(next, apiKey);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "I'm here. Want to try that again in a moment?" }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="screen chat" data-screen-label="07 Chat with Stella">
      <div className="s-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="s-title">Stella</h2>
        <button className="icon-btn" onClick={() => { setMessages([{ role: "assistant", content: "Fresh start. What's on your mind?" }]); localStorage.removeItem("stella.chat"); }} aria-label="Clear chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          </svg>
        </button>
      </div>

      <div className="chat-stella-banner">
        <StellaMini variant={variant} size={28} />
        <span className="dot" />
        Stella is here, quietly
      </div>

      <div className="chat-thread" ref={threadRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role === "user" ? "you" : "stella"}`}>
            {m.content}
          </div>
        ))}
        {pending && (
          <div className="bubble stella typing">
            <span className="d" /><span className="d" /><span className="d" />
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="chat-suggestions">
          {CHAT_SUGGESTIONS.map((s) => (
            <button key={s} className="chat-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <form
        className="chat-input-row"
        onSubmit={(e) => { e.preventDefault(); send(); }}
      >
        <input
          type="text"
          placeholder="Say something to Stella..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <button className="send" type="submit" disabled={!input.trim() || pending} aria-label="Send">
          <IcSend />
        </button>
      </form>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.ZoneScreen = ZoneScreen;
window.MapScreen = MapScreen;
window.FindUsersScreen = FindUsersScreen;
window.ChatScreen = ChatScreen;
window.Dock = Dock;
window.AmbientStella = AmbientStella;
