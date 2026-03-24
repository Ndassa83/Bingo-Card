import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

const COLORS = [
  "#FF6B6B",
  "#FECA57",
  "#FF9FF3",
  "#FF9500",
  "#FF4757",
  "#FFF176",
  "#FFD700",
  "#FF8C00",
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  radius: number;
  gravity: number;
  decay: number;
  trail: { x: number; y: number }[];
};

type Rocket = {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
  trail: { x: number; y: number }[];
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createExplosion(x: number, y: number, color: string): Particle[] {
  const count = Math.floor(randomBetween(60, 100));
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(1.5, 6);
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color,
      radius: randomBetween(1.5, 3),
      gravity: 0.08,
      decay: randomBetween(0.012, 0.022),
      trail: [],
    };
  });
}

export function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function launchRocket() {
      if (!canvas) return;
      const x = randomBetween(canvas.width * 0.15, canvas.width * 0.85);
      const targetY = randomBetween(canvas.height * 0.1, canvas.height * 0.45);
      rockets.push({
        x,
        y: canvas.height,
        vy: randomBetween(-14, -10),
        targetY,
        color: randomColor(),
        trail: [],
      });
    }

    let lastLaunch = 0;
    let launchInterval = randomBetween(400, 900);

    function draw(timestamp: number) {
      if (!ctx || !canvas) return;

      // Fading trail effect
      ctx.fillStyle = "rgba(15, 5, 30, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Auto-launch rockets
      if (timestamp - lastLaunch > launchInterval) {
        const burst = Math.random() < 0.25 ? 3 : 1;
        for (let i = 0; i < burst; i++) {
          setTimeout(() => launchRocket(), i * 120);
        }
        lastLaunch = timestamp;
        launchInterval = randomBetween(500, 1200);
      }

      // Update & draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 12) r.trail.shift();
        r.y += r.vy;
        r.vy *= 0.98;

        // Draw rocket trail
        for (let t = 0; t < r.trail.length; t++) {
          const alpha = (t / r.trail.length) * 0.8;
          ctx.beginPath();
          ctx.arc(r.trail[t].x, r.trail[t].y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = r.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
          ctx.fill();
        }

        // Rocket head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        if (r.y <= r.targetY) {
          const explosion = createExplosion(r.x, r.y, r.color);
          particles.push(...explosion);
          rockets.splice(i, 1);
        }
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Particle trail
        for (let t = 0; t < p.trail.length; t++) {
          const trailAlpha = (t / p.trail.length) * p.alpha * 0.5;
          ctx.beginPath();
          ctx.arc(p.trail[t].x, p.trail[t].y, p.radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.floor(trailAlpha * 255).toString(16).padStart(2, "0");
          ctx.fill();
        }

        // Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    }

    // Kick off a few bursts immediately
    for (let i = 0; i < 3; i++) {
      setTimeout(() => launchRocket(), i * 250);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "linear-gradient(160deg, #0F051E 0%, #1A0A2E 50%, #0D0520 100%)",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </Box>
  );
}
