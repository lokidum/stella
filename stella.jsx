// Stella character component — handles idle bob, breathe, spotted glow, listening tilt, particles.
// Loaded BEFORE app.jsx. Exports to window.

const { useEffect, useRef, useState, useMemo } = React;

const STELLA_VARIANTS = [
  {
    id: "blob",
    name: "Pip",
    blurb: "a soft blob who hums quietly to himself",
    src: "assets/stella-blob.png",
  },
  {
    id: "bear",
    name: "Mochi",
    blurb: "round ears, stubby paws, a tiny smile",
    src: "assets/stella-bear.png",
  },
  {
    id: "ghost",
    name: "Wisp",
    blurb: "a gentle ghost-shape who drifts on warm air",
    src: "assets/stella-ghost.png",
  },
];

/** Stella, animated. Pass mode = idle | spotted | listening | reassuring. */
function Stella({ variant = "blob", size = 180, mode = "idle", tilt = { x: 0, y: 0 }, style }) {
  const v = STELLA_VARIANTS.find((x) => x.id === variant) ?? STELLA_VARIANTS[0];

  // Slight long-period drift so Stella is "always moving"
  const [drift, setDrift] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const dt = (t - start) / 1000;
      setDrift({
        x: Math.sin(dt * 0.4) * 6,
        y: Math.cos(dt * 0.3) * 4,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rotateX = tilt.rotateX || 0;
  const rotateY = tilt.rotateY || 0;
  const hasRotate = rotateX !== 0 || rotateY !== 0;
  const wrapStyle = {
    width: size,
    height: size,
    transform: hasRotate
      ? `translate3d(${tilt.x + drift.x}px, ${tilt.y + drift.y}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      : `translate(${tilt.x + drift.x}px, ${tilt.y + drift.y}px)`,
    transformStyle: hasRotate ? "preserve-3d" : undefined,
    transition: "transform 0.18s ease-out",
    ...style,
  };

  // Reassuring particles
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        left: 20 + Math.random() * 60,
        delay: Math.random() * 6,
        dx: (Math.random() - 0.5) * 60,
        duration: 5 + Math.random() * 3,
      })),
    []
  );

  return (
    <div
      className={`stella-wrap stella-bob ${mode === "spotted" ? "spotted" : ""} ${mode === "listening" ? "listening" : ""}`}
      style={wrapStyle}
    >
      <div className="stella-spot-glow" />
      {mode === "reassuring" && (
        <div className="particles">
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                left: `${p.left}%`,
                bottom: "10%",
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                "--dx": `${p.dx}px`,
              }}
            />
          ))}
        </div>
      )}
      <img className="stella-img" src={v.src} alt={v.name} draggable={false} />
    </div>
  );
}

/** Tiny inline Stella for badges and inline use */
function StellaMini({ variant = "blob", size = 30 }) {
  const v = STELLA_VARIANTS.find((x) => x.id === variant) ?? STELLA_VARIANTS[0];
  return (
    <img
      className="mini-stella"
      src={v.src}
      alt=""
      style={{ width: size, height: size, filter: "drop-shadow(0 2px 4px rgba(0,80,110,0.18))" }}
      draggable={false}
    />
  );
}

window.Stella = Stella;
window.StellaMini = StellaMini;
window.STELLA_VARIANTS = STELLA_VARIANTS;
