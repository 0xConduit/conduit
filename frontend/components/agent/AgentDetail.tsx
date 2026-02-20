'use client';

import { motion } from 'framer-motion';
import type { Agent } from '../../lib/types';
import { AgentStatus } from '../../lib/types';
import RoleBadge from './RoleBadge';
import ReputationBar from './ReputationBar';
import CapabilityTag from './CapabilityTag';

interface AgentDetailProps {
  agent: Agent;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  [AgentStatus.IDLE]: '#22c55e',
  [AgentStatus.PROCESSING]: '#eab308',
  [AgentStatus.DORMANT]: '#6b7280',
};

function formatBalance(balance: number): string {
  return `${balance.toFixed(4)} ETH`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 bg-[#0a0a0c]/90 backdrop-blur-sm"
    >
      {/* Accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-indigo-500/50 to-violet-500/30" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-white/95 mb-1">{agent.name}</h2>
            {agent.description && (
              <p className="text-xs text-white/40 mb-2">{agent.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-mono"
                style={{ color: statusColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                {agent.status}
              </span>
            </div>
          </div>
          <RoleBadge role={agent.role} size="md" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Balance</div>
            <div className="text-sm font-mono text-white/80">{formatBalance(agent.settlement_balance)}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Attestation</div>
            <ReputationBar score={agent.attestation_score} />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Capabilities</div>
            <div className="text-sm font-mono text-white/80">{agent.capabilities.length}</div>
          </div>
        </div>

        {/* Capabilities list */}
        {agent.capabilities.length > 0 && (
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Capabilities</div>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.map(c => (
                <CapabilityTag key={c} capability={c} selected />
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Created</div>
            <div className="text-[11px] font-mono text-white/50">{formatDate(agent.created_at)}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Updated</div>
            <div className="text-[11px] font-mono text-white/50">{formatDate(agent.updated_at)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
