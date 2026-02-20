'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import TopNav from '../../components/nav/TopNav';
import RoleBadge from '../../components/agent/RoleBadge';
import AbilitySelector from '../../components/agent/AbilitySelector';
import CapabilityTag from '../../components/agent/CapabilityTag';
import { AgentRole } from '../../lib/types';
import type { Ability } from '../../types/contract';
import { abilityLabel } from '../../lib/bitmap';
import { useAuth } from '../../components/Providers';
import { useAgentStore } from '../../store/useAgentStore';

const STEPS = ['Name', 'Role', 'Capabilities', 'Review', 'Submit'] as const;

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

export default function RegisterPage() {
  const router = useRouter();
  const { authenticated } = useAuth();
  const { createAgent } = useAgentStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState<AgentRole>(AgentRole.EXECUTOR);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Convert selected abilities to string labels for the API
  const capabilityStrings = abilities.map(a => abilityLabel(a));

  const canProceed = () => {
    switch (step) {
      case 0: return name.length > 0;
      case 1: return true;
      case 2: return abilities.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createAgent({
        name,
        description: description || undefined,
        role,
        capabilities: capabilityStrings,
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
        <TopNav />
        <div className="pt-[80px] px-6 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-white/20 text-lg mb-2">Authentication Required</div>
          <p className="text-white/30 text-sm mb-4">Connect your wallet to register an agent.</p>
          <button
            onClick={() => router.push('/')}
            className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors uppercase tracking-widest"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
        <TopNav />
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
              onClick={() => router.push('/agents')}
              className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors uppercase tracking-widest"
            >
              Browse Agents
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <TopNav />

      <div className="pt-[80px] px-6 max-w-xl mx-auto pb-20">
        {/* Back link */}
        <button
          onClick={() => router.push('/agents')}
          className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/70 uppercase tracking-widest mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Agents
        </button>

        <h1 className="text-2xl font-medium text-white/95 mb-2">Register Agent</h1>
        <p className="text-sm text-white/40 mb-8">Register your agent in {STEPS.length} steps.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border transition-colors ${
                  i <= step
                    ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 text-white/30'
                }`}
              >
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-[1px] ${i < step ? 'bg-indigo-400/30' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="mb-8"
          >
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Agent Name</div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter agent name..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded px-4 py-3 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-colors font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Description (optional)</div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What does your agent do?"
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/10 rounded px-4 py-3 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
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
            )}

            {step === 2 && (
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Select Capabilities</div>
                <AbilitySelector
                  selected={abilities}
                  onChange={setAbilities}
                  mode="register"
                />
              </div>
            )}

            {step === 3 && (
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
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || isSubmitting}
            className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-default uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>

          {step < STEPS.length - 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-default transition-all"
            >
              Next
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest px-5 py-2.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Register Agent
                  <Check className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
