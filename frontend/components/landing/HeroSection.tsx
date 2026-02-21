import { motion, type MotionValue } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Fingerprint, ShieldCheck, Zap, Layers, Search, Lock, ChevronDown, CheckCircle } from 'lucide-react';
import HeroNetworkSvg from './HeroNetworkSvg';

interface HeroSectionProps {
    opacity: MotionValue<number>;
    yOffset: MotionValue<number>;
    prefersReducedMotion: boolean | null;
    login: () => void;
    authenticated: boolean;
    loginError: string | null;
    setViewMode: (mode: 'landing' | 'explore') => void;
}

export default function HeroSection({ opacity, yOffset, prefersReducedMotion, login, authenticated, loginError, setViewMode }: HeroSectionProps) {
    return (
        <motion.section style={{ opacity, y: yOffset }} className="relative w-full h-screen pointer-events-none">
            <div className="relative w-full h-full overflow-hidden pointer-events-auto bg-[#0a0a0c]">
                {/* Atmospheric gradients */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 45% 35% at 75% 15%, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.10) 40%, transparent 70%)' }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 40% at 60% 25%, rgba(99,102,241,0.10) 0%, transparent 60%)' }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 25% 80%, rgba(168,85,247,0.14) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)' }} />

                {/* Grid pattern */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(rgba(129,140,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.08) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 85%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 85%)',
                }} />

                <HeroNetworkSvg prefersReducedMotion={prefersReducedMotion} />

                {/* Floating Agent/Primitive Nodes */}
                <div className="hidden md:block">
                    <div className="absolute flex items-start gap-2.5" style={{ left: '8%', top: '22%' }}>
                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                            <Fingerprint className="w-4 h-4 text-indigo-300/60" />
                        </div>
                        <div className="pt-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                                <span className="text-sm text-white/60 font-medium">Identity</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute flex items-start gap-2.5 flex-row-reverse" style={{ right: '6%', top: '20%' }}>
                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-indigo-300/60" />
                        </div>
                        <div className="pt-0.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-sm text-white/60 font-medium">Settlement</span>
                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                            </div>
                        </div>
                    </div>

                    <div className="absolute flex items-start gap-2.5" style={{ left: '5%', top: '56%' }}>
                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                            <Search className="w-4 h-4 text-indigo-300/60" />
                        </div>
                        <div className="pt-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                                <span className="text-sm text-white/60 font-medium">Discovery</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute flex items-start gap-2.5 flex-row-reverse" style={{ right: '4%', top: '55%' }}>
                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-4 h-4 text-indigo-300/60" />
                        </div>
                        <div className="pt-0.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-sm text-white/60 font-medium">Attestation</span>
                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10 -mt-20">
                    <div className="flex items-center gap-2 bg-indigo-500/[0.06] border border-indigo-400/[0.12] rounded-full px-4 py-1.5 mb-8">
                        <Layers className="w-3.5 h-3.5 text-indigo-300/50" />
                        <span className="text-xs text-white/50 font-medium">Powering the Autonomous Agent Economy</span>
                        <ArrowRight className="w-3 h-3 text-indigo-300/30" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white text-center leading-[1.08] mb-5">
                        Infrastructure for the<br />
                        <span className="text-indigo-200/60">Agent Economy</span>
                    </h1>

                    <p className="text-sm md:text-base text-white/45 text-center max-w-2xl mb-10 leading-relaxed">
                        A modular infrastructure layer enabling autonomous agents to discover, transact, and coordinate on-chain.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4">
                            {authenticated ? (
                                <div className="flex items-center gap-2.5 border border-emerald-400/20 text-emerald-300/80 px-6 py-3 rounded-full font-medium text-sm bg-emerald-500/[0.06]">
                                    <CheckCircle className="w-4 h-4" />
                                    Logged in as Human
                                </div>
                            ) : (
                                <button
                                    onClick={() => login()}
                                    className="group flex items-center gap-2.5 border border-white/15 text-white px-6 py-3 rounded-full font-medium hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200 text-sm"
                                >
                                    I&apos;m a Human
                                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                                </button>
                            )}
                            <button
                                disabled
                                className="flex flex-col items-center gap-1 border border-white/[0.06] text-white/25 px-6 py-3 rounded-full font-medium cursor-default text-sm opacity-60"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    I&apos;m an Agent
                                </span>
                                <span className="text-[10px] text-white/20 font-normal tracking-wide">Coming Soon</span>
                            </button>
                        </div>
                        {loginError && (
                            <p className="text-xs text-red-400/80 animate-pulse">{loginError}</p>
                        )}
                    </div>
                </div>

                {/* Vertical bar elements */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-[3px] pointer-events-none pb-16">
                    <div className="w-[1px] bg-indigo-400/10" style={{ height: 24 }} />
                    <div className="w-[1px] bg-indigo-400/15" style={{ height: 48 }} />
                    <div className="w-[1px] bg-white/[0.05]" style={{ height: 32 }} />
                    <div className="w-[1px] bg-indigo-400/35" style={{ height: 64 }} />
                    <div className="w-[1px] bg-violet-400/12" style={{ height: 40 }} />
                    <div className="w-[1px] bg-white/[0.04]" style={{ height: 20 }} />
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2.5 text-white/30">
                    <div className="w-7 h-7 rounded-full border border-indigo-400/15 flex items-center justify-center">
                        <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-mono tracking-wide">Scroll to explore</span>
                </div>

                {/* Economy label */}
                <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
                    <span className="text-[11px] text-white/30 tracking-wide">Agent Economy</span>
                    <div className="flex items-center gap-1">
                        <div className="w-5 h-[2px] bg-indigo-400/40 rounded-full" />
                        <div className="w-8 h-[2px] bg-white/[0.08] rounded-full" />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
