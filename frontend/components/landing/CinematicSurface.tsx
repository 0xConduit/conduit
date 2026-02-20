'use client';

import { memo, useRef, useEffect } from 'react';

interface CinematicSurfaceProps {
  reduceMotion: boolean;
}

const CinematicSurface = memo(function CinematicSurface({ reduceMotion }: CinematicSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let time = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + 'px';
      canvas!.style.height = h + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      if (w === 0 || h === 0) {
        if (!reduceMotion) animId = requestAnimationFrame(drawFrame);
        return;
      }

      // 1. Background fill
      ctx!.fillStyle = '#0a0b14';
      ctx!.fillRect(0, 0, w, h);

      // Wave parameters
      const centerY = h * 0.45;
      const A1 = h * 0.15;
      const A2 = h * 0.07;
      const A3 = h * 0.025;

      const f1 = (2 * Math.PI) / (w * 0.9);
      const f2 = (2 * Math.PI) / (w * 0.38);
      const f3 = (2 * Math.PI) / (w * 0.15);

      const speed1 = (2 * Math.PI) / 45;
      const speed2 = (2 * Math.PI) / 30;
      const speed3 = (2 * Math.PI) / 20;

      // 2. Wave function (no noise — smooth sine harmonics only)
      function waveY(x: number, offsetY: number = 0): number {
        return centerY + offsetY
          + A1 * Math.sin(x * f1 + time * speed1)
          + A2 * Math.sin(x * f2 + time * speed2 + 0.5)
          + A3 * Math.sin(x * f3 + time * speed3 + 1.2);
      }

      // 3. Draw 4 filled wave layers (back to front for depth)
      const layers = [
        { offset: -40, colors: ['rgba(15, 25, 45, 0)', 'rgba(20, 35, 55, 0.08)', 'rgba(30, 50, 70, 0.12)'] },
        { offset: -15, colors: ['rgba(15, 25, 45, 0)', 'rgba(25, 40, 60, 0.12)', 'rgba(40, 60, 85, 0.18)'] },
        { offset: 0,   colors: ['rgba(10, 20, 40, 0)', 'rgba(30, 50, 75, 0.15)', 'rgba(55, 80, 110, 0.25)'] },
        { offset: 10,  colors: ['rgba(10, 20, 40, 0)', 'rgba(25, 45, 65, 0.10)', 'rgba(45, 70, 100, 0.15)'] },
      ];

      for (const layer of layers) {
        // Build filled path: bottom-left → wave curve → bottom-right
        ctx!.beginPath();
        ctx!.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
          ctx!.lineTo(x, waveY(x, layer.offset));
        }
        ctx!.lineTo(w, h);
        ctx!.closePath();

        // Vertical gradient from bottom (transparent) to wave surface (colored)
        const minWaveY = centerY + layer.offset - A1 - A2 - A3;
        const grad = ctx!.createLinearGradient(0, h, 0, minWaveY);
        grad.addColorStop(0, layer.colors[0]);
        grad.addColorStop(0.5, layer.colors[1]);
        grad.addColorStop(1, layer.colors[2]);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      // 4. Surface lighting pass — slope-based warm/cool ribbon segments
      const ribbonThickness = 15;
      const segmentWidth = 24;

      for (let sx = 0; sx < w; sx += segmentWidth) {
        const ex = Math.min(sx + segmentWidth, w);

        // Compute average slope in this segment
        const yLeft = waveY(sx);
        const yRight = waveY(ex);
        const slope = (yRight - yLeft) / (ex - sx);
        const slopeNorm = Math.max(-1, Math.min(1, slope * 8));

        // Build ribbon trapezoid for this segment
        ctx!.beginPath();
        // Top edge (wave - ribbonThickness)
        for (let x = sx; x <= ex; x += 2) {
          if (x === sx) ctx!.moveTo(x, waveY(x) - ribbonThickness);
          else ctx!.lineTo(x, waveY(x) - ribbonThickness);
        }
        // Bottom edge (wave + ribbonThickness), traced in reverse
        for (let x = ex; x >= sx; x -= 2) {
          ctx!.lineTo(x, waveY(x) + ribbonThickness);
        }
        ctx!.closePath();

        // Color based on slope
        let r: number, g: number, b: number, alpha: number;
        if (slopeNorm < -0.1) {
          // Light-facing — warm peach/amber
          const warmth = Math.min(1, Math.abs(slopeNorm));
          r = Math.round(196 * 0.6 + 184 * 0.4);
          g = Math.round(148 * 0.6 + 147 * 0.4);
          b = Math.round(122 * 0.6 + 90 * 0.4);
          alpha = 0.15 + warmth * 0.2;
        } else if (slopeNorm > 0.1) {
          // Shadow side — cool steel blue
          const coolness = Math.min(1, Math.abs(slopeNorm));
          r = 70;
          g = 100;
          b = 135;
          alpha = 0.08 + coolness * 0.12;
        } else {
          // Neutral mid-tone
          r = 55;
          g = 75;
          b = 105;
          alpha = 0.1;
        }

        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx!.fill();
      }

      // 5. Surface highlight glow — single continuous stroke along the wave crest
      ctx!.save();
      ctx!.shadowBlur = 12;
      ctx!.shadowColor = 'rgba(196, 148, 122, 0.4)';
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = 'rgba(196, 148, 122, 0.15)';
      ctx!.beginPath();
      ctx!.moveTo(0, waveY(0));
      for (let x = 2; x <= w; x += 2) {
        ctx!.lineTo(x, waveY(x));
      }
      ctx!.stroke();
      ctx!.restore();

      // 6. Vignette overlay
      const vignette = ctx!.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'rgba(10, 11, 20, 0)');
      vignette.addColorStop(0.7, 'rgba(10, 11, 20, 0.3)');
      vignette.addColorStop(1, 'rgba(10, 11, 20, 0.75)');
      ctx!.fillStyle = vignette;
      ctx!.fillRect(0, 0, w, h);

      if (!reduceMotion) {
        time += 1 / 60;
        animId = requestAnimationFrame(drawFrame);
      }
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) drawFrame();
    });
    ro.observe(container);
    resize();
    drawFrame();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [reduceMotion]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
});

export default CinematicSurface;
