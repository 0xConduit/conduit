'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import TopNav from '../../components/nav/TopNav';
import AgentCard from '../../components/agent/AgentCard';
import { useAgentStore } from '../../store/useAgentStore';
import { AgentRole, AgentStatus } from '../../lib/types';
import type { SortField } from '../../lib/agent-service';

const ROLES = [AgentRole.ROUTER, AgentRole.EXECUTOR, AgentRole.SETTLER] as const;
const STATUSES = [AgentStatus.IDLE, AgentStatus.PROCESSING, AgentStatus.DORMANT] as const;

const ROLE_COLORS: Record<AgentRole, string> = {
  [AgentRole.ROUTER]: '#3b82f6',
  [AgentRole.EXECUTOR]: '#22c55e',
  [AgentRole.SETTLER]: '#a855f7',
};

export default function AgentBrowsePage() {
  const router = useRouter();
  const {
    filteredAgents,
    isLoading,
    sortField,
    loadAgents,
    setFilters,
    clearFilters,
    setSort,
  } = useAgentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AgentRole | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus | undefined>();
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Sync local state to store filters
  useEffect(() => {
    setFilters({
      role: selectedRole,
      status: selectedStatus,
      searchQuery: searchQuery || undefined,
    });
  }, [searchQuery, selectedRole, selectedStatus, setFilters]);

  const handleClear = () => {
    setSearchQuery('');
    setSelectedRole(undefined);
    setSelectedStatus(undefined);
    clearFilters();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <TopNav />

      <div className="pt-[80px] px-6 max-w-7xl mx-auto pb-20">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-white/95 mb-2">Agent Registry</h1>
          <p className="text-sm text-white/40">Discover and filter registered agents by role, status, and attestation.</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          {showFilters && (
            <div className="w-72 flex-shrink-0 space-y-5">
              {/* Role filter */}
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Role</div>
                <div className="space-y-1.5">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(selectedRole === role ? undefined : role)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 border rounded text-xs transition-colors ${
                        selectedRole === role
                          ? 'border-white/20 bg-white/[0.06] text-white/90'
                          : 'border-white/[0.06] bg-transparent text-white/50 hover:bg-white/[0.03]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ROLE_COLORS[role] }}
                      />
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Status</div>
                <div className="space-y-1">
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(selectedStatus === status ? undefined : status)}
                      className={`w-full text-left px-3 py-1.5 text-[11px] rounded transition-colors ${
                        selectedStatus === status
                          ? 'bg-white/[0.06] text-white/90'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-[10px] text-white/40 hover:text-white/70 uppercase tracking-widest py-2 border border-white/[0.06] rounded transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search + sort bar */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 uppercase tracking-widest border border-white/10 px-3 py-2 rounded transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filters
              </button>

              <div className="flex-1 flex items-center gap-2 border border-white/10 rounded px-3 py-2 bg-white/[0.02]">
                <Search className="w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/30 outline-none"
                />
              </div>

              <select
                value={sortField}
                onChange={e => setSort(e.target.value as SortField)}
                className="text-[10px] text-white/60 bg-[#0a0a0c] border border-white/10 rounded px-3 py-2 uppercase tracking-widest outline-none"
              >
                <option value="attestation_score">Attestation</option>
                <option value="settlement_balance">Balance</option>
                <option value="capabilities">Capabilities</option>
                <option value="created_at">Newest</option>
              </select>
            </div>

            {/* Agent grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-white/20 text-sm mb-2">No agents match your filters</div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => router.push(`/agents/${agent.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
