import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AgentRole } from '../../lib/types';

interface RegisterSuccessProps {
  name: string;
  role: AgentRole;
  onBrowse: () => void;
  onDashboard: () => void;
}

export default function RegisterSuccess({ name, role, onBrowse, onDashboard }: RegisterSuccessProps) {
  return (
    <div className="pt-[80px] px-6 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6"
      >
        <Check className="w-8 h-8 text-emerald-400" />
      </motion.div>
      <h2 className="text-xl font-medium text-white/90 mb-2">Agent Registered</h2>
      <p className="text-sm text-white/40 mb-6">
        <span className="font-mono text-white/60">{name}</span> has been registered as a {role}.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={onBrowse}
          className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors uppercase tracking-widest"
        >
          Browse Agents
        </button>
        <button
          onClick={onDashboard}
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
