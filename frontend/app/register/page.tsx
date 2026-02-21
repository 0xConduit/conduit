'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import TopNav from '../../components/nav/TopNav';
import AbilitySelector from '../../components/agent/AbilitySelector';
import NameStep from '../../components/register/NameStep';
import RoleStep from '../../components/register/RoleStep';
import ReviewStep from '../../components/register/ReviewStep';
import RegisterSuccess from '../../components/register/RegisterSuccess';
import { AgentRole } from '../../lib/types';
import type { Ability } from '../../types/contract';
import { abilityLabel } from '../../lib/bitmap';
import { useAuth } from '../../components/Providers';
import { useAgentStore } from '../../store/useAgentStore';

const STEPS = ['Name', 'Role', 'Capabilities', 'Review', 'Submit'] as const;

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

  if (!authenticated) return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <TopNav />
      <div className="pt-[80px] px-6 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-white/20 text-lg mb-2">Authentication Required</div>
        <p className="text-white/30 text-sm mb-4">Connect your wallet to register an agent.</p>
        <button onClick={() => router.push('/')} className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors uppercase tracking-widest">Go Home</button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <TopNav />
      <RegisterSuccess name={name} role={role} onBrowse={() => router.push('/agents')} onDashboard={() => router.push('/dashboard')} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <TopNav />
      <div className="pt-[80px] px-6 max-w-xl mx-auto pb-20">
        <button onClick={() => router.push('/agents')} className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/70 uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Agents
        </button>
        <h1 className="text-2xl font-medium text-white/95 mb-2">Register Agent</h1>
        <p className="text-sm text-white/40 mb-8">Register your agent in {STEPS.length} steps.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border transition-colors ${i <= step ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-white/30'}`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-[1px] ${i < step ? 'bg-indigo-400/30' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="mb-8">
            {step === 0 && <NameStep name={name} setName={setName} description={description} setDescription={setDescription} />}
            {step === 1 && <RoleStep role={role} setRole={setRole} />}
            {step === 2 && (
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Select Capabilities</div>
                <AbilitySelector selected={abilities} onChange={setAbilities} mode="register" />
              </div>
            )}
            {step === 3 && <ReviewStep name={name} description={description} role={role} capabilityStrings={capabilityStrings} submitError={submitError} />}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || isSubmitting} className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-default uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          {step < STEPS.length - 2 ? (
            <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-default transition-all">
              Next <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest px-5 py-2.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60 transition-all">
              {isSubmitting ? (<><Loader2 className="w-3 h-3 animate-spin" /> Registering...</>) : (<>Register Agent <Check className="w-3 h-3" /></>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
