// Mirror of Conduit.sol types — keep in sync with contracts/conduit/src/Conduit.sol

export { Ability } from './abilities';
import { Ability } from './abilities';

export enum Chain {
  BASE = 0,
  HEDERA = 1,
  ZEROG = 2,
}

export const CHAIN_LABELS: Record<Chain, string> = {
  [Chain.BASE]: 'Base',
  [Chain.HEDERA]: 'Hedera',
  [Chain.ZEROG]: '0G',
};

export const CHAIN_COLORS: Record<Chain, string> = {
  [Chain.BASE]: '#3b82f6',   // blue
  [Chain.HEDERA]: '#a855f7', // purple
  [Chain.ZEROG]: '#22c55e',  // green
};

export enum AbilityCategory {
  PERCEPTION = 0,
  LANGUAGE = 1,
  REASONING = 2,
  PLANNING = 3,
  TOOL_USE = 4,
  MEMORY = 5,
  INTERACTION = 6,
  SAFETY = 7,
}

export const CATEGORY_BIT_RANGES: Record<AbilityCategory, { start: number; end: number }> = {
  [AbilityCategory.PERCEPTION]:  { start: 0,   end: 31 },
  [AbilityCategory.LANGUAGE]:    { start: 32,  end: 63 },
  [AbilityCategory.REASONING]:   { start: 64,  end: 95 },
  [AbilityCategory.PLANNING]:    { start: 96,  end: 127 },
  [AbilityCategory.TOOL_USE]:    { start: 128, end: 159 },
  [AbilityCategory.MEMORY]:      { start: 160, end: 191 },
  [AbilityCategory.INTERACTION]: { start: 192, end: 223 },
  [AbilityCategory.SAFETY]:      { start: 224, end: 255 },
};

export const CATEGORY_LABELS: Record<AbilityCategory, string> = {
  [AbilityCategory.PERCEPTION]:  'Perception',
  [AbilityCategory.LANGUAGE]:    'Language',
  [AbilityCategory.REASONING]:   'Reasoning',
  [AbilityCategory.PLANNING]:    'Planning',
  [AbilityCategory.TOOL_USE]:    'Tool Use',
  [AbilityCategory.MEMORY]:      'Memory',
  [AbilityCategory.INTERACTION]: 'Interaction',
  [AbilityCategory.SAFETY]:      'Safety',
};

export const CATEGORY_COLORS: Record<AbilityCategory, string> = {
  [AbilityCategory.PERCEPTION]:  '#f59e0b', // amber
  [AbilityCategory.LANGUAGE]:    '#3b82f6', // blue
  [AbilityCategory.REASONING]:   '#8b5cf6', // violet
  [AbilityCategory.PLANNING]:    '#06b6d4', // cyan
  [AbilityCategory.TOOL_USE]:    '#f97316', // orange
  [AbilityCategory.MEMORY]:      '#ec4899', // pink
  [AbilityCategory.INTERACTION]: '#10b981', // emerald
  [AbilityCategory.SAFETY]:      '#ef4444', // red
};

// Mirrors Solidity Agent struct
export interface ContractAgent {
  exists: boolean;
  name: string;       // bytes32 decoded to string
  chain: Chain;
  price: bigint;
  reputation: bigint;
  abilities: bigint;
}

// Extended with address for frontend use
export interface Agent extends ContractAgent {
  address: string;
}

// Human-readable labels derived from enum names
// PERCEPTION_VISUAL_RECOGNITION -> "Visual Recognition"
export const ABILITY_LABELS: Record<Ability, string> = (() => {
  const labels = {} as Record<Ability, string>;
  const categoryPrefixes = [
    'PERCEPTION_', 'LANGUAGE_', 'REASONING_', 'PLANNING_',
    'TOOL_USE_', 'MEMORY_', 'INTERACTION_', 'SAFETY_',
  ];
  for (const key of Object.keys(Ability).filter(k => isNaN(Number(k)))) {
    const value = Ability[key as keyof typeof Ability] as Ability;
    let label = key;
    for (const prefix of categoryPrefixes) {
      if (label.startsWith(prefix)) {
        label = label.slice(prefix.length);
        break;
      }
    }
    labels[value] = label
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
  return labels;
})();
