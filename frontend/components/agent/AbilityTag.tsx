'use client';

import { type Ability, CATEGORY_COLORS } from '../../types/contract';
import { abilityLabel, abilityCategory } from '../../lib/bitmap';

interface AbilityTagProps {
  ability: Ability;
  selected?: boolean;
  onClick?: () => void;
}

export default function AbilityTag({ ability, selected, onClick }: AbilityTagProps) {
  const category = abilityCategory(ability);
  const color = CATEGORY_COLORS[category];
  const label = abilityLabel(ability);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center text-[10px] font-mono px-2 py-1 border rounded transition-colors ${
        onClick ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'
      } ${selected ? 'bg-white/10' : 'bg-white/[0.02]'}`}
      style={{
        borderColor: selected ? `${color}66` : 'rgba(255,255,255,0.1)',
        color: selected ? `${color}dd` : 'rgba(255,255,255,0.6)',
      }}
    >
      <span
        className="w-1 h-1 rounded-full mr-1.5 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}
