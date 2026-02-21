import { AgentRole } from '../../lib/types';
import RoleBadge from '../agent/RoleBadge';
import CapabilityTag from '../agent/CapabilityTag';

interface ReviewStepProps {
  name: string;
  description: string;
  role: AgentRole;
  capabilityStrings: string[];
  submitError: string | null;
}

export default function ReviewStep({ name, description, role, capabilityStrings, submitError }: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Review</div>
      <div className="border border-white/10 bg-white/[0.02] rounded p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Name</span>
          <span className="text-sm font-mono text-white/80">{name}</span>
        </div>
        {description && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Description</span>
            <span className="text-xs text-white/60">{description}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Role</span>
          <RoleBadge role={role} />
        </div>
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-2">
            Capabilities ({capabilityStrings.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {capabilityStrings.slice(0, 8).map(c => (
              <CapabilityTag key={c} capability={c} selected />
            ))}
            {capabilityStrings.length > 8 && (
              <span className="text-[10px] text-white/30 font-mono px-2 py-1">
                +{capabilityStrings.length - 8} more
              </span>
            )}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {submitError}
        </div>
      )}
    </div>
  );
}
