'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TopNav from '../../../components/nav/TopNav';
import AgentDetail from '../../../components/agent/AgentDetail';
import { useAgentStore } from '../../../store/useAgentStore';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { selectedAgent, isLoading, selectAgent } = useAgentStore();

  useEffect(() => {
    if (id) {
      selectAgent(id);
    }
  }, [id, selectAgent]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <TopNav />

      <div className="pt-[80px] px-6 max-w-3xl mx-auto pb-20">
        {/* Back link */}
        <button
          onClick={() => router.push('/agents')}
          className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/70 uppercase tracking-widest mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Agents
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : selectedAgent ? (
          <AgentDetail agent={selectedAgent} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-white/20 text-lg mb-2">Agent not found</div>
            <p className="text-white/30 text-sm mb-4">No agent found with this ID.</p>
            <button
              onClick={() => router.push('/agents')}
              className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors uppercase tracking-widest"
            >
              Browse Agents
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
