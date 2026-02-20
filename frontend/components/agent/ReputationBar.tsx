'use client';

interface ReputationBarProps {
  score: number; // 0–1 float from attestation_score
}

export default function ReputationBar({ score }: ReputationBarProps) {
  const pct = Math.min(score * 100, 100);

  // Color scale: red -> yellow -> green
  const color =
    pct >= 80 ? '#22c55e' :
    pct >= 60 ? '#eab308' :
    pct >= 40 ? '#f97316' :
    '#ef4444';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-white/70" style={{ color }}>
        {(score * 100).toFixed(0)}%
      </span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
