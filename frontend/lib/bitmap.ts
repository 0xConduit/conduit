// TypeScript equivalents of Conduit.sol bitmap helpers, operating on bigint

import {
  Ability,
  AbilityCategory,
  ABILITY_LABELS,
  CATEGORY_BIT_RANGES,
} from '../types/contract';

/** Single ability bitmask: 1n << BigInt(ability) */
export function bit(ability: Ability): bigint {
  return 1n << BigInt(ability);
}

/** Check if a specific ability bit is set */
export function hasAbility(bitmap: bigint, ability: Ability): boolean {
  return (bitmap & bit(ability)) !== 0n;
}

/** Check all bits in mask are set */
export function hasAllAbilities(bitmap: bigint, mask: bigint): boolean {
  return (bitmap & mask) === mask;
}

/** Check any bit in mask is set */
export function hasAnyAbilities(bitmap: bigint, mask: bigint): boolean {
  return (bitmap & mask) !== 0n;
}

/** Build bitmap from array of Ability values */
export function abilitiesToBitmap(abilities: Ability[]): bigint {
  let bitmap = 0n;
  for (const a of abilities) {
    bitmap |= bit(a);
  }
  return bitmap;
}

/** Decode bitmap -> Ability[] array */
export function bitmapToAbilities(bitmap: bigint): Ability[] {
  const abilities: Ability[] = [];
  for (let i = 0; i < 256; i++) {
    if ((bitmap & (1n << BigInt(i))) !== 0n) {
      abilities.push(i as Ability);
    }
  }
  return abilities;
}

/** Population count using Brian Kernighan's algorithm */
export function countAbilities(bitmap: bigint): number {
  let count = 0;
  let b = bitmap;
  while (b !== 0n) {
    b &= b - 1n;
    count++;
  }
  return count;
}

/** Filter to abilities within a category's bit range */
export function getAbilitiesInCategory(bitmap: bigint, category: AbilityCategory): Ability[] {
  const { start, end } = CATEGORY_BIT_RANGES[category];
  const abilities: Ability[] = [];
  for (let i = start; i <= end; i++) {
    if ((bitmap & (1n << BigInt(i))) !== 0n) {
      abilities.push(i as Ability);
    }
  }
  return abilities;
}

/** Human-readable label: PERCEPTION_VISUAL_RECOGNITION -> "Visual Recognition" */
export function abilityLabel(ability: Ability): string {
  return ABILITY_LABELS[ability] ?? `Ability ${ability}`;
}

/** Derive category from ability index (each category spans 32 bits) */
export function abilityCategory(ability: Ability): AbilityCategory {
  return Math.floor(ability / 32) as AbilityCategory;
}

/** Decode a hex bytes32 string to a UTF-8 string (right-padded with zeros) */
export function decodeBytes32(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    const byte = parseInt(clean.slice(i, i + 2), 16);
    if (byte === 0) break;
    bytes.push(byte);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Encode a string to a 0x-prefixed bytes32 hex (max 31 chars) */
export function encodeBytes32(str: string): string {
  const bytes = new TextEncoder().encode(str.slice(0, 31));
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return '0x' + hex.padEnd(64, '0');
}
