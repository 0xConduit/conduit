'use client';

interface CapabilityTagProps {
  capability: string;
  selected?: boolean;
  onClick?: () => void;
}

const COLOR = '#6366f1'; // indigo

export default function CapabilityTag({ capability, selected, onClick }: CapabilityTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center text-[10px] font-mono px-2 py-1 border rounded transition-colors ${
        onClick ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'
      } ${selected ? 'bg-white/10' : 'bg-white/[0.02]'}`}
      style={{
        borderColor: selected ? `${COLOR}66` : 'rgba(255,255,255,0.1)',
        color: selected ? `${COLOR}dd` : 'rgba(255,255,255,0.6)',
      }}
    >
      <span
        className="w-1 h-1 rounded-full mr-1.5 flex-shrink-0"
        style={{ backgroundColor: COLOR }}
      />
      {capability}
    </button>
  );
}
