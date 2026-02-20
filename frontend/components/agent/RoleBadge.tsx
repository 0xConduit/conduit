'use client';

import { AgentRole } from '../../lib/types';

const ROLE_COLORS: Record<AgentRole, string> = {
  [AgentRole.ROUTER]: '#3b82f6',   // blue
  [AgentRole.EXECUTOR]: '#22c55e', // green
  [AgentRole.SETTLER]: '#a855f7',  // purple
};

interface RoleBadgeProps {
  role: AgentRole;
  size?: 'sm' | 'md';
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const color = ROLE_COLORS[role];
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-mono ${
        isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
      style={{
        borderColor: `${color}33`,
        backgroundColor: `${color}0d`,
        color: `${color}cc`,
      }}
    >
      <span
        className={`rounded-full ${isSm ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: color }}
      />
      {role}
    </span>
  );
}
