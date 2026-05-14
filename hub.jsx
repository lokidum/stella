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
  // Subscribe to the global audio manager so the Zone tab can show a tiny
  // glowing dot whenever ambient audio is playing in the background, no
  // matter which screen we're on. The subscription itself is cheap and the
  // dock is mounted on every screen that shows it.
  const audio = useStellaAudio();
  const zoneClass =
    `dock-item ${active === "zone" ? "active" : ""} ${audio.isPlaying ? "zone-playing" : ""}`;

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
      <button className={zoneClass} onClick={() => onNav("zone")}>
        <span className="zone-icon-wrap">
          <IcHeadphones />
          {audio.isPlaying && <span className="zone-pulse" aria-hidden="true" />}
        </span>
        <span>Zone</span>
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

function HomeScreen({ variant, name, status, setStatus, perms, geo, onNav, onAR, onChat, onOpenSetup }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const currentStatus = STATUSES.find((s) => s.id === status) || STATUSES[0];
  const locOn = perms?.location === "granted";

  useEffect(() => {
    if (locOn && geo && window.fetchWeather) {
      window.fetchWeather(geo.lat, geo.lon).then((w) => w && setWeather(w));
    }
  }, [locOn, geo && geo.lat, geo && geo.lon]);

  return (
    <div className="screen home" data-screen-label="03 Home Hub">
      <div className="home-header">
        <h1 className="home-greeting">So good to see you again, {name}!</h1>
        <div className="home-header-right">
          {onOpenSetup && (
            <button className="perms-link" onClick={onOpenSetup} aria-label="Permissions">
              permissions
            </button>
          )}
          <div className="home-avatar">{(name || "M").slice(0, 1).toUpperCase()}</div>
        </div>
      </div>

      <div className="home-stella">
        <Stella variant={variant} size={110} mode="idle" />
      </div>

      <div className="weather-chip">
        {locOn && weather ? (
          <>
            <span className="w-icon" aria-hidden="true">{weather.icon}</span>
            <span><b>{weather.tempC}°C</b> · {weather.vibe}</span>
          </>
        ) : locOn ? (
          <>
            <span className="led" />
            Stella is reading the sky…
          </>
        ) : (
          <>
            <span className="led" />
            Stella is here, with you.
          </>
        )}
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
            <div className="icon-art" style={{ background: "rgba(255,255,255,0.7)" }}>
              <IcMapPin stroke="#3a7d6a" />
            </div>
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
          <div className="tile-title">Conversations</div>
          <div className="tile-sub">Old link-ups · no number needed</div>
        </button>
      </div>
    </div>
  );
}

/* ----------------------- Zone Out ----------------------- */
// Curated picks from the audios/ folder. Eight calm instrumental tracks that
// match Stella's tone. The src strings use the actual file names (encoded for
// the spaces) and the StellaAudio manager loads them lazily on first play.
const TRACKS = [
  { id: "moonlight",   name: "Moonlight",       artist: "Stella picks", src: "audios/Moonlight.mp3" },
  { id: "lunar-waves", name: "Lunar Waves",     artist: "Drifting",     src: "audios/Lunar%20Waves.mp3" },
  { id: "hollow-river", name: "Hollow river",   artist: "Water · soft", src: "audios/hollow%20river.mp3" },
  { id: "quiet-life",  name: "Quiet Life",      artist: "Sit a while",  src: "audios/Quiet%20Life.mp3" },
  { id: "sunrise",     name: "Sunrise",         artist: "Gentle warm",  src: "audios/Sunrise.mp3" },
  { id: "velvet",      name: "Velvet",          artist: "Soft loop",    src: "audios/Velvet.mp3" },
  { id: "echo-branches", name: "Echo Branches", artist: "Outdoors",     src: "audios/Echo%20Branches.mp3" },
  { id: "timeless",    name: "Timeless Space",  artist: "Drift",        src: "audios/Timeless%20Space.mp3" },
];

// Register the catalog with the global audio manager. Safe to call at module
// load — StellaAudio doesn't fetch anything until play() is called.
if (typeof window !== "undefined" && window.StellaAudio) {
  window.StellaAudio.setTracks(TRACKS);
}

// Hook: subscribes a component to the global audio manager. Returns the live
// state and re-renders whenever play/pause/track changes. The audio itself
// keeps running across unmounts — only the subscription is component-scoped.
function useStellaAudio() {
  const [state, setState] = useState(() =>
    typeof window !== "undefined" && window.StellaAudio
      ? window.StellaAudio.getState()
      : { trackId: null, isPlaying: false, volume: 0.7, loading: false }
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.StellaAudio) return;
    const unsubscribe = window.StellaAudio.subscribe(setState);
    return unsubscribe;
  }, []);
  return state;
}

function ZoneScreen({ variant, onBack }) {
  const audio = useStellaAudio();
  const [noiseCancel, setNoiseCancel] = useState(true);
  const [stellaShield, setStellaShield] = useState(true);

  // The track shown in the "Now playing" card. Defaults to the first track
  // before anything has been played. When something IS playing, mirror the
  // global state so leaving and returning to this screen shows the right one.
  const currentTrack =
    TRACKS.find((t) => t.id === audio.trackId) || TRACKS[0];
  const isPlaying = audio.isPlaying;

  // Play/pause toggle. The first tap on this button is what unlocks the
  // mobile browser's Web Audio API — Howler handles the unlock internally.
  const togglePlay = useCallback(() => {
    if (!window.StellaAudio) return;
    if (isPlaying) {
      window.StellaAudio.pause();
    } else if (audio.trackId) {
      window.StellaAudio.resume();
    } else {
      // Nothing's ever been played — start the default first track.
      window.StellaAudio.play(currentTrack.id);
    }
  }, [isPlaying, audio.trackId, currentTrack.id]);

  const pickTrack = useCallback((id) => {
    if (!window.StellaAudio) return;
    // Tapping a chip plays that track immediately (with crossfade if another
    // is already playing). This also satisfies the first-tap audio unlock.
    window.StellaAudio.play(id);
  }, []);

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
            <div className={`album ${isPlaying ? "playing" : ""}`}>
              <IcHeadphones stroke={undefined} />
            </div>
            <div className="meta">
              <div className="track">{currentTrack.name}</div>
              <div className="artist">
                {audio.loading
                  ? "loading…"
                  : isPlaying
                    ? currentTrack.artist
                    : `${currentTrack.artist} · paused`}
              </div>
            </div>
            <button
              className="play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <IcPause /> : <IcPlay />}
            </button>
          </div>

          <div className="ambient-list">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                className={`ambient-chip ${audio.trackId === t.id ? "active" : ""}`}
                onClick={() => pickTrack(t.id)}
              >
                {t.name}
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

const FACE_NAMES = ["Sam", "Priya", "Jay", "Stella"];
const FACE_MOODS = [
  { mood: "Quiet, open to a chat", note: "Said hi to two people today." },
  { mood: "Feeling social", note: "Looking for a study buddy." },
  { mood: "Wobbly today", note: "Would love a gentle wave. No pressure." },
  { mood: "Just here", note: "Listening to the day." },
];

function FindUsersScreen({ variant, perms, setPerm, onBack, onChat }) {
  const videoRef = useRef(null);
  const ar3dRef = useRef(null);
  const [camOn, setCamOn] = useState(false);
  const [permState, setPermState] = useState("ask"); // ask | loading | granted | denied
  const [selected, setSelected] = useState(null);
  const [waved, setWaved] = useState({});
  const [haloClicked, setHaloClicked] = useState(null);

  // Mount cinematic AR halos when camera is on. Falls back to CSS halos otherwise.
  // `?ar3d=preview` query forces mount with a synthetic video for headless previews.
  const ar3dPreview = typeof window !== "undefined" && /[?&]ar3d=preview/.test(window.location.search);
  Sense.useAR3D({
    containerRef: ar3dRef,
    videoRef,
    active: camOn || ar3dPreview,
    bypassVideo: ar3dPreview,
    mode: "halos",
    variant,
    onHaloClick: (name) => {
      const fallback = NEARBY_STELLAS.find((u) => u.name === name) || NEARBY_STELLAS[0];
      setSelected(fallback.id);
      setHaloClicked(name);
    },
  });

  // Stream is kept in state so the always-mounted <video> below can pick it up
  // via a follow-up effect even when ref isn't ready inside start().
  const [stream, setStream] = useState(null);

  const start = async () => {
    setPermState("loading");
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermState("denied");
      setPerm && setPerm("camera", "denied");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
      setPermState("granted");
      setPerm && setPerm("camera", "granted");
    } catch (e) {
      setPermState("denied");
      setPerm && setPerm("camera", "denied");
    }
  };

  // Safety + iOS Safari kick: re-attach the stream and retry .play() until the
  // video has dimensions. WebKit drops the first play() after a srcObject swap.
  useEffect(() => {
    if (!stream) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.srcObject !== stream) v.srcObject = stream;
    let cancelled = false;
    let attempts = 0;
    const kick = () => {
      if (cancelled || !videoRef.current) return;
      const vv = videoRef.current;
      vv.muted = true;
      vv.setAttribute("playsinline", "");
      vv.setAttribute("webkit-playsinline", "");
      const p = vv.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      attempts++;
      if (attempts < 8 && (vv.videoWidth === 0 || vv.paused)) {
        setTimeout(kick, 250);
      }
    };
    kick();
    return () => { cancelled = true; };
  }, [stream, camOn]);

  useEffect(() => {
    return () => {
      const s = videoRef.current?.srcObject;
      if (s?.getTracks) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Camera off → fall back to fixtures.
  const liveUsers = camOn ? [] : NEARBY_STELLAS;
  const sel = NEARBY_STELLAS.find((u) => u.id === selected);

  return (
    <div className="screen ar-view" data-screen-label="06 Find Stella Users">
      {/* Camera — always in layout flow; opacity-toggled to dodge iOS Safari's
          display:none/block teardown of the video plane. */}
      <video
        ref={videoRef}
        className="ar-camera"
        playsInline
        muted
        autoPlay
        webkit-playsinline="true"
        style={{
          opacity: camOn ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 0.25s ease",
        }}
      />
      {(camOn || ar3dPreview) && <div ref={ar3dRef} className="ar3d-stage" />}
      {!camOn && !ar3dPreview && <div className="ar-fallback-bg" />}
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

      {/* Camera-off fallback halos (CSS); when camera is on the R3F canvas owns it. */}
      {permState !== "ask" && permState !== "loading" && !camOn && (
        <>
          {liveUsers.map((u) => (
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

/* ----------------------- Conversations (link-ups with past Stella friends) ----------------------- */

// Mock conversation seed: people you waved at through Stella but never grabbed
// numbers from. The threads pick up where you left off. Persisted to localStorage
// once first opened so new messages stick across sessions.
const CONVERSATIONS_SEED = [
  {
    id: "sam",
    name: "Sam",
    variant: "blob",
    where: "Library cafe, Tuesday",
    online: true,
    messages: [
      { from: "them", text: "hey thanks for waving back the other day :)", t: -2 * 24 * 60 * 60 * 1000 },
      { from: "you", text: "thanks for not making it weird", t: -2 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000 },
      { from: "them", text: "literally been hoping someone else would. you free thursday for cafe again?", t: -1 * 24 * 60 * 60 * 1000 },
    ],
  },
  {
    id: "priya",
    name: "Priya",
    variant: "bear",
    where: "INB101, yesterday",
    online: false,
    messages: [
      { from: "them", text: "did you finish the inb101 reading?", t: -1 * 24 * 60 * 60 * 1000 },
      { from: "you", text: "almost. p46 onwards is dense", t: -1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000 },
      { from: "them", text: "right?? coffee + chapter 4 tomorrow if you're up", t: -1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000 },
      { from: "you", text: "yes please", t: -1 * 24 * 60 * 60 * 1000 + 14 * 60 * 1000 },
      { from: "them", text: "🫧", t: -22 * 60 * 60 * 1000 },
    ],
  },
  {
    id: "jay",
    name: "Jay",
    variant: "ghost",
    where: "P-block courtyard, 4 days ago",
    online: false,
    messages: [
      { from: "them", text: "i think i saw your stella by the jacaranda", t: -4 * 24 * 60 * 60 * 1000 },
      { from: "you", text: "yeah she likes it there", t: -4 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000 },
      { from: "them", text: "small wave", t: -4 * 24 * 60 * 60 * 1000 + 11 * 60 * 1000 },
      { from: "you", text: "small wave back", t: -4 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000 },
    ],
  },
  {
    id: "quiet",
    name: "Ren",
    variant: "blob",
    where: "Old Government House lawn, last week",
    online: false,
    messages: [
      { from: "them", text: "🫧", t: -6 * 24 * 60 * 60 * 1000 },
      { from: "you", text: "🫧", t: -6 * 24 * 60 * 60 * 1000 + 14 * 60 * 1000 },
    ],
  },
];

// Friend reply pools — used to mock a reply 1.5s after the user sends.
const REPLY_POOL = {
  sam: ["sounds good", "yeah :)", "for sure", "thursday's still on", "see you there"],
  priya: ["okay! 📚", "yes please", "ill bring the coffee", "🫧", "same time same place?"],
  jay: ["nice", "🫧", "okay", "soft wave", "i'll be around"],
  quiet: ["🫧", "🌙", "...", "🫧🫧"],
};

function formatTimeAgo(ts) {
  const now = Date.now();
  const diff = now - (now + ts); // ts is negative offset from now
  // ts stored as negative offsets from "now-on-load"; convert to absolute ago
  const ago = -ts;
  const s = Math.floor(ago / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d`;
}

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem("stella.conversations") || "null");
    if (saved && Array.isArray(saved) && saved.length) return saved;
  } catch {}
  return CONVERSATIONS_SEED;
}

function ChatScreen({ name, onBack }) {
  const [conversations, setConversations] = useState(() => loadConversations());
  const [openId, setOpenId] = useState(null);
  const [input, setInput] = useState("");
  const [typingId, setTypingId] = useState(null);
  const threadRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("stella.conversations", JSON.stringify(conversations)); } catch {}
  }, [conversations]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [openId, typingId, conversations]);

  const openThread = useCallback((id) => { setOpenId(id); setInput(""); }, []);
  const closeThread = useCallback(() => { setOpenId(null); setInput(""); }, []);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !openId) return;
    setInput("");
    setConversations((prev) =>
      prev.map((c) => c.id === openId
        ? { ...c, messages: [...c.messages, { from: "you", text, t: -Date.now() + Date.now() }] }
        : c
      )
    );
    // Mock a reply
    setTypingId(openId);
    const id = openId;
    setTimeout(() => {
      setTypingId(null);
      const pool = REPLY_POOL[id] || ["🫧"];
      const reply = pool[Math.floor(Math.random() * pool.length)];
      setConversations((prev) =>
        prev.map((c) => c.id === id
          ? { ...c, messages: [...c.messages, { from: "them", text: reply, t: 0 }] }
          : c
        )
      );
    }, 1400 + Math.random() * 800);
  }, [input, openId]);

  const sel = conversations.find((c) => c.id === openId);

  // ----- Thread view -----
  if (sel) {
    return (
      <div className="screen chat" data-screen-label="07 Conversation">
        <div className="s-header">
          <button className="icon-btn" onClick={closeThread} aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h2 className="s-title">{sel.name}</h2>
          <div style={{ width: 36 }} />
        </div>

        <div className="chat-stella-banner">
          <StellaMini variant={sel.variant} size={28} />
          <span className="dot" style={{ background: sel.online ? "#5cd9a3" : "#b6b6c8" }} />
          {sel.online ? "online now" : sel.where}
        </div>

        <div className="chat-thread" ref={threadRef}>
          {sel.messages.map((m, i) => (
            <div key={i} className={`bubble ${m.from === "you" ? "you" : "stella"}`}>
              {m.text}
            </div>
          ))}
          {typingId === sel.id && (
            <div className="bubble stella typing">
              <span className="d" /><span className="d" /><span className="d" />
            </div>
          )}
        </div>

        <form
          className="chat-input-row"
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        >
          <input
            type="text"
            placeholder={`Message ${sel.name}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="send" type="submit" disabled={!input.trim()} aria-label="Send">
            <IcSend />
          </button>
        </form>
      </div>
    );
  }

  // ----- List view -----
  return (
    <div className="screen chat" data-screen-label="07 Conversations">
      <div className="s-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 className="s-title">Conversations</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="conv-sub">
        Old link-ups. No numbers swapped — just Stella waves you kept going.
      </div>

      <div className="conv-list">
        {conversations.map((c) => {
          const last = c.messages[c.messages.length - 1];
          const preview = last ? (last.from === "you" ? `you · ${last.text}` : last.text) : "";
          return (
            <button key={c.id} className="conv-card" onClick={() => openThread(c.id)}>
              <div className="conv-avatar">
                <StellaMini variant={c.variant} size={44} />
                {c.online && <span className="conv-online" />}
              </div>
              <div className="conv-body">
                <div className="conv-row">
                  <span className="conv-name">{c.name}</span>
                  <span className="conv-time">{formatTimeAgo(last?.t || 0)}</span>
                </div>
                <div className="conv-preview">{preview}</div>
                <div className="conv-where">{c.where}</div>
              </div>
            </button>
          );
        })}
      </div>
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
