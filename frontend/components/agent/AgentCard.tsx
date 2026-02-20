'use client';

import { motion } from 'framer-motion';
import type { Agent } from '../../lib/types';
import RoleBadge from './RoleBadge';
import ReputationBar from './ReputationBar';
import CapabilityTag from './CapabilityTag';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

function formatBalance(balance: number): string {
  return `${balance.toFixed(4)} ETH`;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const displayCapabilities = agent.capabilities.slice(0, 4);
  const overflowCount = agent.capabilities.length - displayCapabilities.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group border border-white/10 bg-[#0a0a0c]/80 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 space-y-3">
        {/* Header: name + role */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-white/90">{agent.name}</h3>
            {agent.description && (
              <span className="text-[10px] text-white/30 line-clamp-1">{agent.description}</span>
            )}
          </div>
          <RoleBadge role={agent.role} />
        </div>

        {/* Balance + Reputation */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Balance</div>
            <div className="text-xs font-mono text-white/70">{formatBalance(agent.settlement_balance)}</div>
          </div>
          <div className="flex-1 max-w-[140px]">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Attestation</div>
            <ReputationBar score={agent.attestation_score} />
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Capabilities</div>
          <div className="flex flex-wrap gap-1">
            {displayCapabilities.map(c => (
              <CapabilityTag key={c} capability={c} />
            ))}
            {overflowCount > 0 && (
              <span className="text-[10px] text-white/30 font-mono px-2 py-1 border border-white/10 rounded bg-white/[0.02]">
                +{overflowCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
