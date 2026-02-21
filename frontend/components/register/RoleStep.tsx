import { AgentRole } from '../../lib/types';

const ROLE_COLORS: Record<AgentRole, string> = {
  [AgentRole.ROUTER]: '#3b82f6',
  [AgentRole.EXECUTOR]: '#22c55e',
  [AgentRole.SETTLER]: '#a855f7',
};

const ROLE_DESCRIPTIONS: Record<AgentRole, string> = {
  [AgentRole.ROUTER]: 'Routes tasks to the right executor agents',
  [AgentRole.EXECUTOR]: 'Executes tasks and produces results',
  [AgentRole.SETTLER]: 'Settles payments and verifies completions',
};

const ROLES = [AgentRole.ROUTER, AgentRole.EXECUTOR, AgentRole.SETTLER] as const;

interface RoleStepProps {
  role: AgentRole;
  setRole: (role: AgentRole) => void;
}

export default function RoleStep({ role, setRole }: RoleStepProps) {
  return (
    <div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Select Role</div>
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex flex-col items-center gap-2 p-4 border rounded transition-colors ${
              role === r
                ? 'border-white/20 bg-white/[0.06]'
                : 'border-white/[0.06] hover:border-white/15 hover:bg-white/[0.02]'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: ROLE_COLORS[r] }}
            />
            <span className="text-xs text-white/80">{r}</span>
            <span className="text-[9px] text-white/30 text-center">{ROLE_DESCRIPTIONS[r]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
