'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ───────────────────────────────────────────────────
   Particle system rendered on a <canvas> element.
   Lightweight: ~120 particles, no WebGL needed.
   ─────────────────────────────────────────────────── */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    hue: number; // 220‑280 range (blue→violet)
    pulse: number; // phase offset for brightness oscillation
}

function createParticles(w: number, h: number, count: number): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.12,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
            hue: 220 + Math.random() * 60,
            pulse: Math.random() * Math.PI * 2,
        });
    }
    return particles;
}

export default function DashboardBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animRef = useRef<number>(0);
    const timeRef = useRef(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        timeRef.current += 0.004;
        const t = timeRef.current;

        ctx.clearRect(0, 0, w, h);

        /* ── draw connection lines between nearby particles ── */
        const particles = particlesRef.current;
        const connectionDist = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connectionDist) {
                    const alpha = (1 - dist / connectionDist) * 0.06;
                    ctx.strokeStyle = `rgba(130,140,248,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        /* ── draw & update particles ── */
        for (const p of particles) {
            const brightness = p.opacity * (0.7 + 0.3 * Math.sin(t * 2 + p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${brightness})`;
            ctx.fill();

            // glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
            const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
            grd.addColorStop(0, `hsla(${p.hue}, 70%, 70%, ${brightness * 0.3})`);
            grd.addColorStop(1, `hsla(${p.hue}, 70%, 70%, 0)`);
            ctx.fillStyle = grd;
            ctx.fill();

            // move
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            if (p.y < -10) p.y = h + 10;
            if (p.y > h + 10) p.y = -10;
        }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);
            // re-create particles on resize so they fill the viewport
            particlesRef.current = createParticles(window.innerWidth, window.innerHeight, 100);
        };

        resize();
        window.addEventListener('resize', resize);

        animRef.current = requestAnimationFrame(draw);
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animRef.current);
        };
    }, [draw]);

    return (
        <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
            {/* ── Layer 1: Base gradient ── */}
            <div className="absolute inset-0 bg-[#06060a]" />

            {/* ── Layer 2: Aurora blobs ── */}
            <div className="absolute inset-0 aurora-container">
                <div className="aurora-blob aurora-blob-1" />
                <div className="aurora-blob aurora-blob-2" />
                <div className="aurora-blob aurora-blob-3" />
                <div className="aurora-blob aurora-blob-4" />
            </div>

            {/* ── Layer 3: Grid with fade ── */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(130,140,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(130,140,248,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 70%)',
                }}
            />

            {/* ── Layer 4: Scan line ── */}
            <div className="absolute inset-0 scan-line" />

            {/* ── Layer 5: Canvas particles ── */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ mixBlendMode: 'screen' }}
            />

            {/* ── Layer 6: Central radial glow (pulsing) ── */}
            <div className="absolute inset-0 radial-pulse" />

            {/* ── Layer 7: Vignette ── */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(6,6,10,0.8) 100%)',
                }}
            />

            {/* ── Layer 8: Noise texture for depth ── */}
            <div className="absolute inset-0 opacity-[0.03] noise-texture" />
        </div>
    );
}
