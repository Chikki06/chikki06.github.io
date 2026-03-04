import { useEffect, useRef } from "react";

// Short-lived particle-based "failed ignition" used on early clicks.
export default function IgnitionAttemptParticles({
  origin,
  onDone,
  durationMs = 550,
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { innerWidth, innerHeight } = window;
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Keep this localized and avoid full-screen washout.
    ctx.globalCompositeOperation = "source-over";

    const spawn = (x, y, intensity) => {
      // 2–6 particles depending on intensity.
      const count = 1 + Math.floor(Math.random() * (2 * intensity + 1));
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 1.5;
        const vy = -(2 + Math.random() * 3); // ~ -2..-5
        const maxLife = 0.35 + Math.random() * 0.4; // ~0.35..0.75s
        const size = 2 + Math.random() * 5; // ~2..7
        const hue = 15 + Math.random() * 25; // ~15..40 (orange range)

        particlesRef.current.push({
          x,
          y,
          vx,
          vy,
          life: 1,
          maxLife,
          size,
          hue,
        });
      }
    };

    const tick = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsedMs = timestamp - startRef.current;
      const t = elapsedMs / 1000; // seconds since start

      // Faster, smaller pulse: quick ramp then fast fade.
      const ramp = Math.min((t / 0.22) ** 2, 1);
      const fade = t < 0.22 ? 1 : Math.max(0, 1 - (t - 0.22) / 0.3);
      const intensity = ramp * fade;

      // Clear the canvas each frame so we draw pure particles over the UI.
      const { innerWidth, innerHeight } = window;
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      if (intensity > 0) {
        spawn(origin.x, origin.y, intensity);
      }

      const next = [];
      const dt = 1 / 60;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.98;
        p.vx *= 0.99;
        p.life -= dt / p.maxLife;
        if (p.life <= 0) continue;

        const alpha = p.life;
        const r = p.size * (0.4 + 0.6 * p.life);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `hsla(${p.hue}, 95%, 70%, ${alpha})`);
        grad.addColorStop(0.35, `hsla(${p.hue}, 95%, 55%, ${alpha * 0.9})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 10%, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        next.push(p);
      }

      // Prevent unbounded growth.
      particlesRef.current = next.length > 600 ? next.slice(-500) : next;

      if (elapsedMs > durationMs && particlesRef.current.length === 0) {
        if (onDone) onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
      if (onDone) onDone();
    };
  }, [origin.x, origin.y, durationMs, onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 35 }}
      aria-hidden
    />
  );
}

