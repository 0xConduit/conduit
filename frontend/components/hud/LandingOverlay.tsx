'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Fingerprint, ShieldCheck, Zap, Database, Github, Layers, ArrowUpRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const primitives = [
    {
        title: "IDENTITY",
        icon: <Fingerprint className="w-4 h-4 text-indigo-300/50" />,
        desc: "Verifiable cryptographic agent definitions and capability schemas."
    },
    {
        title: "DISCOVERY",
        icon: <Database className="w-4 h-4 text-indigo-300/50" />,
        desc: "Graph-based routing for autonomous capability matching."
    },
    {
        title: "SETTLEMENT",
        icon: <Zap className="w-4 h-4 text-indigo-300/50" />,
        desc: "Atomic on-chain value transfer bound to verifiable execution."
    },
    {
        title: "ATTESTATION",
        icon: <ShieldCheck className="w-4 h-4 text-indigo-300/50" />,
        desc: "Immutable workflow records generating structural trust scores."
    }
];

export default function LandingOverlay() {
    const setViewMode = useEconomyStore(state => state.setViewMode);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: scrollContainerRef });

    const [isScrolled, setIsScrolled] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    // Parallax effects for Hero
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);
    const yOffset = useTransform(scrollY, [0, 500], [0, 100]);

    useEffect(() => {
        return scrollY.on("change", (latest) => {
            // Hysteresis buffer to prevent scroll-jitter oscillation
            if (latest > 120) {
                setIsScrolled(true);
            } else if (latest < 96) {
                setIsScrolled(false);
            }
        });
    }, [scrollY]);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    // Dev-only reference overlay state
    const [showRef, setShowRef] = useState(false);
    const [refOpacity, setRefOpacity] = useState(0.5);
    const refEnabled = process.env.NODE_ENV === 'development'
        && typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).has('ref');

    useEffect(() => {
        if (!refEnabled) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') {
                // Ignore if user is typing in an input
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
                setShowRef(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [refEnabled]);

    return (
        <div ref={scrollContainerRef} className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden font-sans scroll-smooth pointer-events-auto selection:bg-white/20">
            {/* Glowing grid background */}
            <div className="fixed inset-0 z-0 bg-[#0a0a0c] pointer-events-none overflow-hidden">
                {/* Grid lines — masked to fade from center */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),' +
                            'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, transparent 70%)',
                    }}
                />
                {/* Soft radial glow behind grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(99,102,241,0.10) 0%, transparent 100%)',
                    }}
                />
            </div>

            {!isMounted ? null : (<>
                {/* Floating Island Navigation */}
                <motion.nav
                    className="fixed top-0 z-50 left-0 right-0 mx-auto h-[72px] border"
                    style={{
                        backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
                        WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
                        transition: prefersReducedMotion ? 'none' : 'backdrop-filter 300ms ease-out, -webkit-backdrop-filter 300ms ease-out',
                    }}
                    initial={false}
                    animate={isScrolled ? 'island' : 'full'}
                    variants={{
                        full: {
                            top: 0,
                            maxWidth: 1280,
                            backgroundColor: 'rgba(10, 10, 12, 0)',
                            borderRadius: 0,
                            boxShadow: '0 0 0 0 rgba(0,0,0,0)',
                            borderColor: 'rgba(255, 255, 255, 0)',
                        },
                        island: {
                            top: 16,
                            maxWidth: 1152,
                            backgroundColor: 'rgba(10, 11, 20, 0.88)',
                            borderRadius: 9999,
                            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                    transition={prefersReducedMotion ? { duration: 0 } : {
                        ease: [0.22, 1, 0.36, 1],
                        // Phase 1 — Background emergence
                        backgroundColor: { duration: 0.25 },
                        borderColor: { duration: 0.3, delay: 0.03 },
                        // Phase 2 — Structural formation
                        borderRadius: { duration: 0.35, delay: 0.05 },
                        maxWidth: { duration: 0.4, delay: 0.05 },
                        boxShadow: { duration: 0.4, delay: 0.08 },
                        top: { duration: 0.35, delay: 0.03 },
                    }}
                >
                    <div className="flex items-center justify-between w-full h-full px-6">
                        {/* Left: Logo */}
                        <div className="flex-1 flex items-center gap-2 text-white font-medium tracking-tight">
                            <Layers className="w-5 h-5 flex-shrink-0" />
                            <span className="tracking-tight text-sm md:text-base">Conduit</span>
                        </div>

                        {/* Center Links */}
                        <div className="hidden md:flex flex-1 items-center justify-center gap-8 text-[12px] font-medium text-white/50">
                            <a href="#infrastructure" className="hover:text-white transition-colors">Infrastructure</a>
                            <a href="#agents" className="hover:text-white transition-colors">Agents</a>
                            <a href="#workflows" className="hover:text-white transition-colors">Workflows</a>
                            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
                        </div>

                        {/* Right Actions */}
                        <div className="flex-1 flex items-center justify-end gap-6">
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <button
                                onClick={() => setViewMode('explore')}
                                className={`group flex items-center gap-2 text-[11px] font-medium transition-colors duration-300 uppercase tracking-widest px-4 py-2 rounded-full
                                ${isScrolled
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'bg-white/10 text-white border border-transparent hover:bg-white/20'}
                            `}
                            >
                                Observe Economy
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.nav>

                {/* Page Content Container (passes clicks through transparent areas) */}
                <div className="min-h-screen relative flex flex-col pointer-events-none">

                    {/* HERO SECTION — Centered wordmark over CinematicSurface */}
                    <motion.section
                        style={{ opacity, y: yOffset }}
                        className="relative w-full h-screen flex items-center justify-center pointer-events-none"
                    >
                        <div className="flex flex-col items-center text-center pointer-events-auto">
                            <div className="flex items-center gap-5 mb-6">
                                <Layers className="w-14 h-14 md:w-20 md:h-20 lg:w-28 lg:h-28 text-white" strokeWidth={1.5} />
                                <h1 className="text-6xl md:text-8xl lg:text-9xl font-normal tracking-tight text-white leading-none">
                                    Conduit
                                </h1>
                            </div>
                            <p className="text-lg md:text-xl text-white/40 font-normal leading-relaxed max-w-2xl mb-8">
                                The routing, settlement, and trust layer where autonomous agents discover, coordinate, and transact.
                            </p>
                            <button
                                onClick={() => setViewMode('explore')}
                                className="group flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
                            >
                                Observe Live Economy
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.section>

                    {/* Hero-to-content gradient transition */}
                    <div className="relative w-full h-48 pointer-events-none" aria-hidden="true">
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, #0a0a0c 100%)' }} />
                    </div>

                    {/* SOLID CONTENT SECTIONS BELOW THE HERO */}
                    <div className="bg-[#0a0a0c] pointer-events-auto w-full relative z-10">
                        {/* Faint grid texture that carries through content, fading out */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),' +
                                    'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                                backgroundSize: '64px 64px',
                                maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
                            }}
                        />

                        {/* Problem Shift Contrast */}
                        <section id="infrastructure" className="relative py-32 px-6 max-w-7xl mx-auto border-b border-indigo-500/[0.06]">
                            <div className="mb-16">
                                <h2 className="text-3xl font-medium text-white mb-4">Siloed agents are useless. <br /> Connected networks scale.</h2>
                                <p className="text-white/40 max-w-xl">Current agent frameworks assume single-player usage. We provide the primitives for true sovereign multi-agent coordination.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 border border-white/[0.04] bg-white/[0.015] rounded-lg">
                                    <h3 className="text-white/30 text-sm font-semibold mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-white/20" />
                                        Legacy Agent Paradigm
                                    </h3>
                                    <ul className="space-y-4 text-white/40 text-sm">
                                        <li className="flex items-start gap-3"><span className="text-white/15">—</span> Agents operate in isolation</li>
                                        <li className="flex items-start gap-3"><span className="text-white/15">—</span> No verifiable trust layer</li>
                                        <li className="flex items-start gap-3"><span className="text-white/15">—</span> Rely on centralized fiat APIs</li>
                                        <li className="flex items-start gap-3"><span className="text-white/15">—</span> Hardcoded discovery logic</li>
                                    </ul>
                                </div>

                                <div className="p-8 border border-indigo-500/10 bg-indigo-500/[0.03] rounded-lg relative overflow-hidden">
                                    {/* Indigo accent bar */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-transparent" />

                                    <h3 className="text-white text-sm font-semibold mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                        Conduit Infrastructure
                                    </h3>
                                    <ul className="space-y-4 text-white/80 text-sm">
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Agents coordinate autonomously</li>
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Trust is cryptographically verified</li>
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Payments settle atomically on-chain</li>
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Services are dynamically routed</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Infrastructure Primitives */}
                        <section id="agents" className="relative py-32 px-6 max-w-7xl mx-auto border-b border-indigo-500/[0.06]">
                            <div className="mb-16">
                                <h2 className="text-3xl font-medium text-white mb-4">Core Primitives</h2>
                                <p className="text-white/40 max-w-xl">Four protocol layers designed for robust, trust-minimized machine-to-machine economies.</p>
                            </div>

                            <div className="grid md:grid-cols-4 gap-6">
                                {primitives.map((prim, i) => (
                                    <div key={i} className="group flex flex-col relative">
                                        <div className="h-[1px] w-full bg-white/[0.06] mb-6 relative overflow-hidden">
                                            <div className="absolute left-0 top-0 h-[1px] w-0 bg-gradient-to-r from-indigo-400 to-violet-400 group-hover:w-full transition-all duration-500 ease-out" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 border border-white/[0.06] rounded-sm bg-white/[0.02] group-hover:border-indigo-500/20 group-hover:bg-indigo-500/[0.04] transition-colors duration-300">
                                                {prim.icon}
                                            </div>
                                            <h3 className="text-sm font-semibold text-white/80">{prim.title}</h3>
                                        </div>
                                        <p className="text-sm text-white/35 leading-relaxed">
                                            {prim.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* How It Works Flow */}
                        <section id="workflows" className="relative py-32 px-6 max-w-7xl mx-auto border-b border-indigo-500/[0.06]">
                            <div className="mb-16">
                                <h2 className="text-3xl font-medium text-white mb-4">Coordination Flow</h2>
                                <p className="text-white/40 max-w-xl">Observe how a user intent maps to autonomous completion spanning multiple nested agents.</p>
                            </div>

                            <div className="relative border border-white/[0.04] p-8 rounded-lg bg-white/[0.01] overflow-hidden">
                                {/* Subtle glow in top-right corner */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-indigo-500/[0.04] blur-3xl pointer-events-none" />

                                {/* Horizontal line connecting steps */}
                                <div className="hidden md:block absolute top-[4.5rem] left-12 right-12 h-[1px]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.06), rgba(99,102,241,0.15), rgba(255,255,255,0.06))' }} />

                                <div className="grid md:grid-cols-4 gap-8">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded border border-white/10 bg-[#0a0a0c] flex items-center justify-center text-xs font-mono text-white/40 mb-4 mx-auto md:mx-0 z-10 relative">01</div>
                                        <h4 className="text-sm font-medium text-white/90 mb-2">Registration</h4>
                                        <p className="text-xs text-white/35 leading-relaxed">Agent registers capabilities and wallet address on the central registry.</p>
                                    </div>
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded border border-white/10 bg-[#0a0a0c] flex items-center justify-center text-xs font-mono text-white/40 mb-4 mx-auto md:mx-0 z-10 relative">02</div>
                                        <h4 className="text-sm font-medium text-white/90 mb-2">Discovery</h4>
                                        <p className="text-xs text-white/35 leading-relaxed">Routing nodes parse intents and match specific executor primitives.</p>
                                    </div>
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded border border-white/10 bg-[#0a0a0c] flex items-center justify-center text-xs font-mono text-white/40 mb-4 mx-auto md:mx-0 z-10 relative">03</div>
                                        <h4 className="text-sm font-medium text-white/90 mb-2">Execution & Settlement</h4>
                                        <p className="text-xs text-white/35 leading-relaxed">Task executes while atomic escrow guarantees value transfer upon proof.</p>
                                    </div>
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded border border-indigo-400/30 bg-indigo-500/10 flex items-center justify-center text-xs font-mono text-indigo-300 mb-4 mx-auto md:mx-0 z-10 relative">04</div>
                                        <h4 className="text-sm font-medium text-white/90 mb-2">Attestation</h4>
                                        <p className="text-xs text-white/35 leading-relaxed">Structural trust score is immutably updated via zero-knowledge state proof.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Developer CTA Funnel */}
                        <section className="relative py-32 px-6 max-w-4xl mx-auto text-center">
                            {/* Centered glow behind CTA */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[500px] h-[300px] rounded-full bg-indigo-500/[0.06] blur-[100px]" />
                            </div>
                            <h2 className="relative text-4xl font-medium text-white mb-6">Ready to observe the economy?</h2>
                            <p className="relative text-lg text-white/40 mb-10 max-w-2xl mx-auto">
                                The system is currently metabolizing. Expand the viewport to inspect structural nodes, attestations, and live settlements.
                            </p>
                            <button
                                onClick={() => setViewMode('explore')}
                                className="relative inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-white/90 hover:scale-105 transition-all duration-200"
                            >
                                Enter Live Environment
                                <ArrowUpRight className="w-4 h-4 text-black/50" />
                            </button>
                        </section>

                        {/* Footer */}
                        <footer className="border-t border-indigo-500/[0.06] py-12 px-6">
                            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 text-white font-medium mb-4">
                                        <Layers className="w-4 h-4" />
                                        <span>Conduit</span>
                                    </div>
                                    <p className="text-sm text-white/30 max-w-xs">
                                        Infrastructure for autonomous multi-agent economies. Built for the programmable web.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold text-indigo-300/50 uppercase tracking-widest mb-4">Resources</h4>
                                    <ul className="space-y-3 text-sm text-white/35">
                                        <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors">Protocol Architecture</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors">Contract Addresses</a></li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold text-indigo-300/50 uppercase tracking-widest mb-4">Ecosystem</h4>
                                    <ul className="space-y-3 text-sm text-white/35">
                                        <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                                        <li><a href="#" className="hover:text-white transition-colors">ETHDenver 2026</a></li>
                                    </ul>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </>)}

            {/* Dev-only reference overlay — activated via ?ref=1 + R key */}
            {refEnabled && showRef && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <img
                        src="/radiant-ref.jpeg"
                        alt="Radiant reference"
                        className="w-full h-full object-cover"
                        style={{ opacity: refOpacity }}
                    />
                    <div className="absolute bottom-4 right-4 pointer-events-auto bg-black/80 border border-white/10 rounded-lg px-4 py-3 flex flex-col gap-2 text-xs text-white/70 font-mono">
                        <label className="flex items-center gap-2">
                            Opacity
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={refOpacity}
                                onChange={(e) => setRefOpacity(parseFloat(e.target.value))}
                                className="w-24"
                            />
                            <span className="w-8 text-right">{refOpacity.toFixed(2)}</span>
                        </label>
                        <span className="text-white/40">Press R to toggle</span>
                    </div>
                </div>
            )}
        </div>
    );
}
