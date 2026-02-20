'use client';

import { useState, useMemo } from 'react';
import {
  Ability,
  AbilityCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_BIT_RANGES,
} from '../../types/contract';
import { abilityLabel } from '../../lib/bitmap';
import AbilityTag from './AbilityTag';

interface AbilitySelectorProps {
  selected: Ability[];
  onChange: (abilities: Ability[]) => void;
  mode?: 'filter' | 'register';
}

const ALL_CATEGORIES = Object.values(AbilityCategory).filter(
  (v): v is AbilityCategory => typeof v === 'number'
);

export default function AbilitySelector({ selected, onChange, mode = 'filter' }: AbilitySelectorProps) {
  const [activeCategory, setActiveCategory] = useState<AbilityCategory>(AbilityCategory.PERCEPTION);
  const [search, setSearch] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const abilitiesInCategory = useMemo(() => {
    const { start, end } = CATEGORY_BIT_RANGES[activeCategory];
    const abilities: Ability[] = [];
    for (let i = start; i <= end; i++) {
      abilities.push(i as Ability);
    }
    return abilities;
  }, [activeCategory]);

  const filteredAbilities = useMemo(() => {
    if (!search) return abilitiesInCategory;
    const q = search.toLowerCase();
    return abilitiesInCategory.filter(a => abilityLabel(a).toLowerCase().includes(q));
  }, [abilitiesInCategory, search]);

  const toggle = (ability: Ability) => {
    if (selectedSet.has(ability)) {
      onChange(selected.filter(a => a !== ability));
    } else {
      onChange([...selected, ability]);
    }
  };

  const selectAll = () => {
    const toAdd = abilitiesInCategory.filter(a => !selectedSet.has(a));
    onChange([...selected, ...toAdd]);
  };

  const clearCategory = () => {
    const catSet = new Set(abilitiesInCategory);
    onChange(selected.filter(a => !catSet.has(a)));
  };

  const categoryCount = (cat: AbilityCategory): number => {
    const { start, end } = CATEGORY_BIT_RANGES[cat];
    let count = 0;
    for (let i = start; i <= end; i++) {
      if (selectedSet.has(i as Ability)) count++;
    }
    return count;
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-white/[0.06] scrollbar-none">
        {ALL_CATEGORIES.map(cat => {
          const count = categoryCount(cat);
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-2.5 text-[10px] uppercase tracking-widest font-medium transition-colors border-b-2 ${
                isActive
                  ? 'text-white/90 border-current'
                  : 'text-white/40 border-transparent hover:text-white/60'
              }`}
              style={isActive ? { color: CATEGORY_COLORS[cat] } : undefined}
            >
              {CATEGORY_LABELS[cat]}
              {count > 0 && (
                <span className="ml-1.5 text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
        <input
          type="text"
          placeholder="Search abilities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/30 outline-none"
        />
        <button
          type="button"
          onClick={selectAll}
          className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
        >
          All
        </button>
        <span className="text-white/10">|</span>
        <button
          type="button"
          onClick={clearCategory}
          className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Ability grid */}
      <div className="p-3 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        {filteredAbilities.map(ability => (
          <AbilityTag
            key={ability}
            ability={ability}
            selected={selectedSet.has(ability)}
            onClick={() => toggle(ability)}
          />
        ))}
        {filteredAbilities.length === 0 && (
          <span className="text-xs text-white/30 py-4 w-full text-center">No abilities match</span>
        )}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] text-white/40">
            {selected.length} {mode === 'register' ? 'selected' : 'filtering'}
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
