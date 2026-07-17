import { useCallback, useEffect, useRef, useState } from "react";
import { useEasterEggTrigger } from "../hooks/useEasterEggTrigger.js";
import IgnitionAttemptParticles from "./IgnitionAttemptParticles.jsx";

const FIRE_VARIANTS = [
  { label: "demo1", src: "/assets/demo1.mp4" },
  { label: "demo2", src: "/assets/demo2.mp4" },
  { label: "demo3", src: "/assets/demo3.mp4" },
];

const REVEAL_DURATION_MS = 2600;

export default function BackgroundFireOverlay() {
  const {
    isArmed,
    toggleArmed,
    isCapturing,
    preIgnitionSparks,
    hasIgnited,
    ignitionPoint,
    handleCaptureClick,
    clickCount,
  } = useEasterEggTrigger();

  const videoRef = useRef(null);
  const [fireVariant, setFireVariant] = useState(FIRE_VARIANTS[0]);
  const [revealRadius, setRevealRadius] = useState(0);
  const revealStartRef = useRef(null);
  const rafRef = useRef(null);

  const [attempts, setAttempts] = useState([]);
  const [hasVideoIgnited, setHasVideoIgnited] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [hasSettled, setHasSettled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);

  const resetLocal = useCallback(() => {
    setRevealRadius(0);
    setAttempts([]);
    setHasVideoIgnited(false);
    setRevealProgress(0);
    setIsRevealing(false);
    setHasSettled(false);
  }, []);

  // Manage the circular reveal animation once the fire is considered ignited.
  useEffect(() => {
    if (!hasVideoIgnited || !ignitionPoint) return;
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {});
    revealStartRef.current = performance.now();
    setIsRevealing(true);

    const animate = (now) => {
      const start = revealStartRef.current ?? now;
      const elapsed = now - start;
      const t = Math.min(elapsed / REVEAL_DURATION_MS, 1);
      setRevealRadius(t * 160);
      setRevealProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsRevealing(false);
        setHasSettled(true);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hasVideoIgnited, ignitionPoint]);

  // When a different fire clip is chosen, load the new source (so all 3 clips don’t play the same file).
  // If the fire is already lit, restart playback once the new source is ready.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    if (!hasVideoIgnited) return;
    const onReady = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    video.addEventListener("loadeddata", onReady, { once: true });
    return () => video.removeEventListener("loadeddata", onReady);
  }, [fireVariant, hasVideoIgnited]);

  const handleOverlayClick = useCallback(
    (e) => {
      handleCaptureClick(e);
      const { clientX, clientY } = e;

      // Every pre-ignition click should get its own particle attempt.
      if (!hasIgnited) {
        const id = performance.now() + Math.random();
        setAttempts((prev) => [...prev, { id, origin: { x: clientX, y: clientY } }]);
      }

      // Third click: previous clickCount was 2 before this click.
      if (!hasIgnited && clickCount === 2) {
        // Start playback immediately while still inside the user gesture (required on iOS).
        const video = videoRef.current;
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
        setHasVideoIgnited(false);
        setTimeout(() => setHasVideoIgnited(true), 650);
      }
    },
    [handleCaptureClick, hasIgnited, clickCount],
  );

  const clipRadius = revealRadius;

  // Auto-hide hint after a short timeout.
  useEffect(() => {
    if (!showHint) return;
    const id = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(id);
  }, [showHint]);

  // Show hint whenever arming turns on; hide immediately on disarm.
  useEffect(() => {
    if (isArmed) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [isArmed]);

  return (
    <>
      {/* Controls & instructions (anchored to top-right of the page, not viewport) */}
      <div className="pointer-events-none absolute right-4 top-4 z-[35] flex flex-col items-end gap-2 text-xs">
        <button
          type="button"
          className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-colors ${
            isArmed
              ? "border-amber-500 bg-amber-500/20 text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.6)]"
              : "border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-900"
          }`}
          onClick={() => {
            resetLocal();
            toggleArmed();
          }}
          aria-label={isArmed ? "Disarm background fire" : "Arm background fire"}
        >
          <span
            className={`block h-4 w-4 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.7)] transition-opacity ${
              isArmed ? "opacity-100" : "opacity-80"
            }`}
            style={{
              clipPath:
                "path('M8 16 C4 12, 4 8, 7 4 C6.4 6.5, 7.2 8.4, 9 9.5 C10.1 8.1, 10.6 6.3, 10.1 4.3 C12.5 6.3, 14 8.8, 14 11 C14 13.8, 11.8 16, 9 16 Z')",
            }}
          />
        </button>

        {showHint && (
          <div className="pointer-events-auto mt-1 max-w-xs rounded-md bg-black/90 px-3 py-2 text-right font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-200 shadow-lg">
            Your cursor is now a lighter.
            <br />
            Try lighting the fireplace.
          </div>
        )}

        {isArmed && (
          <div className="pointer-events-auto mt-1 flex flex-col items-end gap-1 rounded-md bg-black/80 px-2 py-2 text-[11px] text-neutral-300 shadow-lg">
            <label className="flex items-center gap-2">
              <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                Fire clip
              </span>
              <select
                value={fireVariant.src}
                onChange={(e) => {
                  const next = FIRE_VARIANTS.find((v) => v.src === e.target.value) ?? FIRE_VARIANTS[0];
                  setFireVariant(next);
                }}
                className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px]"
              >
                {FIRE_VARIANTS.map((v) => (
                  <option key={v.src} value={v.src}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Click capture overlay (only when armed and not yet ignited) */}
      {isCapturing && (
        <div
          className="fixed inset-0 z-20"
          style={{
            touchAction: "none",
            cursor: "none",
          }}
          onPointerMove={(event) => setCursorPosition({ x: event.clientX, y: event.clientY })}
          onPointerLeave={() => setCursorPosition(null)}
          onClick={handleOverlayClick}
        >
          {cursorPosition && <img src="/assets/I.png" alt="" aria-hidden="true" className="pointer-events-none fixed z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 object-contain" style={{ left: cursorPosition.x, top: cursorPosition.y }} />}
        </div>
      )}

      {/* We intentionally skip rendering preIgnitionSparks here to avoid an extra yellow dot.
          The main visual feedback for attempts is the particle canvas below. */}

      {/* Particle-based failed ignition attempts (clicks 1 & 2, plus optional 3rd) */}
      {attempts.map(({ id, origin }) => (
        <IgnitionAttemptParticles
          key={id}
          origin={origin}
          onDone={() =>
            setAttempts((prev) => prev.filter((a) => a.id !== id))
          }
        />
      ))}

      {/* Background fire video layer */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={
          ignitionPoint
            ? {
                ["--x"]: `${ignitionPoint.x}px`,
                ["--y"]: `${ignitionPoint.y}px`,
                ["--clip-r"]: clipRadius,
              }
            : undefined
        }
      >
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover mix-blend-screen"
          style={{
            clipPath: ignitionPoint
              ? `circle(calc(var(--clip-r) * 1vmax) at var(--x) var(--y))`
              : "circle(0px at 0px 0px)",
            // During reveal: strong, dramatic ignition; after reveal: softer background.
            opacity: isRevealing
              ? 0.2 + 0.8 * revealProgress
              : hasSettled
              ? 0.38
              : 0.4,
            transition: hasVideoIgnited ? "opacity 900ms ease-out" : undefined,
            filter: "saturate(1.1) contrast(1.05)",
          }}
          aria-hidden
          src={fireVariant.src}
        />
        {/* Dark overlay to keep text readable while still letting ignition feel strong */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>
    </>
  );
}

