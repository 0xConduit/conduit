'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
    ArrowRight, Fingerprint, ShieldCheck, Zap, Database, Github, Layers,
    ArrowUpRight, Search, Eye, User, Bot, Play, ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Providers';
import { useRouter } from 'next/navigation';
import CoordinationFlowDiagram from '../landing/CoordinationFlowDiagram';

const primitives = [
    {
        tag: "01",
        title: "IDENTITY",
        icon: <Fingerprint className="w-5 h-5 text-indigo-300/60" />,
        desc: "Agent identity and registry via iNFTs and Kite credentials."
    },
    {
        tag: "02",
        title: "DISCOVERY",
        icon: <Search className="w-5 h-5 text-indigo-300/60" />,
        desc: "Capability indexing and AI-powered semantic matching."
    },
    {
        tag: "03",
        title: "SETTLEMENT",
        icon: <Zap className="w-5 h-5 text-indigo-300/60" />,
        desc: "On-chain escrow and micropayments via Hedera HTS and Kite x402."
    },
    {
        tag: "04",
        title: "ATTESTATION",
        icon: <ShieldCheck className="w-5 h-5 text-indigo-300/60" />,
        desc: "Verifiable execution records logged to Hedera Consensus Service."
    },
    {
        tag: "05",
        title: "COORDINATION",
        icon: <Database className="w-5 h-5 text-indigo-300/60" />,
        desc: "Multi-agent task orchestration through OpenClaw runtime."
    },
    {
        tag: "06",
        title: "OBSERVABILITY",
        icon: <Eye className="w-5 h-5 text-indigo-300/60" />,
        desc: "Real-time dashboards for earnings, trust scores, and network activity."
    }
];

// Staggered fade-up for Core Primitives
const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

const lineReveal = {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay: 0.1 } }
};

// Developer CTA Funnel entrance
const ctaContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};
const buttonReveal = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

export default function LandingOverlay() {
    const setViewMode = useEconomyStore(state => state.setViewMode);
    const { login, authenticated, loginError, clearLoginError } = useAuth();
    const router = useRouter();
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

    // Redirect to dashboard on successful auth
    useEffect(() => {
        if (authenticated) {
            router.push('/dashboard');
        }
    }, [authenticated, router]);

    // Auto-dismiss login error after 4 seconds
    useEffect(() => {
        if (!loginError) return;
        const timer = setTimeout(() => clearLoginError(), 4000);
        return () => clearTimeout(timer);
    }, [loginError, clearLoginError]);

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
            {/* Dark background */}
            <div className="fixed inset-0 z-0 bg-[#0a0a0c] pointer-events-none" />

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
                        backgroundColor: { duration: 0.25 },
                        borderColor: { duration: 0.3, delay: 0.03 },
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
                            <a href="/agents" className="hover:text-white transition-colors">Agents</a>
                            <a href="#workflows" className="hover:text-white transition-colors">Workflows</a>
                            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
                        </div>

                        {/* Right Actions */}
                        <div className="flex-1 flex items-center justify-end gap-4">
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <button className="text-white/50 hover:text-white transition-colors hidden md:block">
                                <Search className="w-4 h-4" />
                            </button>
                            {authenticated ? (
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className={`group flex items-center gap-2 text-[11px] font-medium transition-colors duration-300 uppercase tracking-widest px-4 py-2 rounded-full
                                    ${isScrolled
                                            ? 'bg-white text-black hover:bg-white/90'
                                            : 'bg-white/10 text-white border border-transparent hover:bg-white/20'}
                                `}
                                >
                                    Dashboard
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            ) : (
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
                            )}
                        </div>
                    </div>
                </motion.nav>

                {/* Page Content Container */}
                <div className="min-h-screen relative flex flex-col pointer-events-none">

                    {/* HERO SECTION — Rounded card with floating nodes */}
                    <motion.section
                        style={{ opacity, y: yOffset }}
                        className="relative w-full h-screen flex flex-col pointer-events-none"
                    >
                        {/* Hero Card Wrapper */}
                        <div className="flex-1 min-h-0 w-full">
                            <div className="relative w-full h-full overflow-hidden pointer-events-auto bg-[#0c0c10]">

                                {/* Atmospheric gradient glow — upper right (indigo/violet) */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'radial-gradient(ellipse 60% 50% at 72% 20%, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.18) 40%, transparent 70%)',
                                    }}
                                />
                                {/* Secondary softer glow */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'radial-gradient(ellipse 80% 60% at 65% 30%, rgba(99,102,241,0.18) 0%, transparent 60%)',
                                    }}
                                />

                                {/* Subtle grid pattern inside card */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(rgba(129,140,248,0.08) 1px, transparent 1px),' +
                                            'linear-gradient(90deg, rgba(129,140,248,0.08) 1px, transparent 1px)',
                                        backgroundSize: '48px 48px',
                                        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 85%)',
                                        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 10%, transparent 85%)',
                                    }}
                                />

                                {/* SVG Network Curves connecting nodes */}
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
                                    viewBox="0 0 1200 800"
                                    preserveAspectRatio="none"
                                    fill="none"
                                >
                                    <defs>
                                        <radialGradient id="pulse-glow-gradient">
                                            <stop offset="0%" stopColor="rgba(129,140,248,0.8)" />
                                            <stop offset="100%" stopColor="rgba(129,140,248,0)" />
                                        </radialGradient>
                                        <filter id="pulse-glow-filter">
                                            <feGaussianBlur stdDeviation="3" />
                                        </filter>
                                    </defs>

                                    {/* Layer 0: Base static curves (always visible) */}
                                    <path id="curve-identity" d="M 160 210 C 300 170, 420 310, 560 350" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
                                    <path id="curve-settlement" d="M 1050 200 C 900 170, 780 310, 640 350" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
                                    <path id="curve-discovery" d="M 140 480 C 280 500, 420 410, 560 380" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
                                    <path id="curve-attestation" d="M 1080 460 C 940 490, 800 410, 650 380" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
                                    <path id="curve-left-vert" d="M 145 230 C 135 310, 130 390, 130 460" stroke="rgba(99,102,241,0.12)" strokeWidth="1" fill="none" />
                                    <path id="curve-right-vert" d="M 1070 220 C 1080 310, 1090 390, 1090 440" stroke="rgba(99,102,241,0.12)" strokeWidth="1" fill="none" />

                                    {!prefersReducedMotion && (<>
                                        {/* Layer 1: Animated dashed flow overlays */}
                                        <path d="M 160 210 C 300 170, 420 310, 560 350" stroke="rgba(129,140,248,0.28)" strokeWidth="1" fill="none"
                                            strokeDasharray="8 16" strokeDashoffset="24"
                                            style={{ animation: 'network-dash-flow 3.5s linear infinite' }} />
                                        <path d="M 1050 200 C 900 170, 780 310, 640 350" stroke="rgba(129,140,248,0.28)" strokeWidth="1" fill="none"
                                            strokeDasharray="8 16" strokeDashoffset="24"
                                            style={{ animation: 'network-dash-flow 4.0s linear infinite' }} />
                                        <path d="M 140 480 C 280 500, 420 410, 560 380" stroke="rgba(129,140,248,0.28)" strokeWidth="1" fill="none"
                                            strokeDasharray="8 16" strokeDashoffset="24"
                                            style={{ animation: 'network-dash-flow 3.8s linear infinite' }} />
                                        <path d="M 1080 460 C 940 490, 800 410, 650 380" stroke="rgba(129,140,248,0.28)" strokeWidth="1" fill="none"
                                            strokeDasharray="8 16" strokeDashoffset="24"
                                            style={{ animation: 'network-dash-flow 4.2s linear infinite' }} />
                                        <path d="M 145 230 C 135 310, 130 390, 130 460" stroke="rgba(129,140,248,0.20)" strokeWidth="1" fill="none"
                                            strokeDasharray="6 20" strokeDashoffset="26"
                                            style={{ animation: 'network-dash-flow 5.0s linear infinite' }} />
                                        <path d="M 1070 220 C 1080 310, 1090 390, 1090 440" stroke="rgba(129,140,248,0.20)" strokeWidth="1" fill="none"
                                            strokeDasharray="6 20" strokeDashoffset="26"
                                            style={{ animation: 'network-dash-flow 5.5s linear infinite' }} />

                                        {/* Layer 2: Traveling glow pulses */}
                                        {/* Identity → center: 2 pulses */}
                                        <circle r="6" fill="url(#pulse-glow-gradient)" opacity="0.8" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="5.0s" repeatCount="indefinite" begin="0.0s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-identity" />
                                            </animateMotion>
                                        </circle>
                                        <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="5.0s" repeatCount="indefinite" begin="2.5s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-identity" />
                                            </animateMotion>
                                        </circle>

                                        {/* Settlement → center: 2 pulses */}
                                        <circle r="6" fill="url(#pulse-glow-gradient)" opacity="0.8" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="5.5s" repeatCount="indefinite" begin="1.2s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-settlement" />
                                            </animateMotion>
                                        </circle>
                                        <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="5.5s" repeatCount="indefinite" begin="3.9s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-settlement" />
                                            </animateMotion>
                                        </circle>

                                        {/* Discovery → center: 2 pulses */}
                                        <circle r="6" fill="url(#pulse-glow-gradient)" opacity="0.8" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="4.8s" repeatCount="indefinite" begin="0.7s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-discovery" />
                                            </animateMotion>
                                        </circle>
                                        <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="4.8s" repeatCount="indefinite" begin="3.1s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-discovery" />
                                            </animateMotion>
                                        </circle>

                                        {/* Attestation → center: 2 pulses */}
                                        <circle r="6" fill="url(#pulse-glow-gradient)" opacity="0.8" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="6.0s" repeatCount="indefinite" begin="1.8s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-attestation" />
                                            </animateMotion>
                                        </circle>
                                        <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="6.0s" repeatCount="indefinite" begin="4.8s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-attestation" />
                                            </animateMotion>
                                        </circle>

                                        {/* Left vertical: 1 pulse */}
                                        <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="4.5s" repeatCount="indefinite" begin="2.0s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-left-vert" />
                                            </animateMotion>
                                        </circle>

                                        {/* Right vertical: 1 pulse */}
                                        <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                                            <animateMotion dur="4.5s" repeatCount="indefinite" begin="3.3s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                                                <mpath xlinkHref="#curve-right-vert" />
                                            </animateMotion>
                                        </circle>
                                    </>)}
                                </svg>

                                {/* Floating Agent/Primitive Nodes — hidden on mobile */}
                                <div className="hidden md:block">
                                    {/* Identity — top left */}
                                    <div className="absolute flex items-start gap-2.5" style={{ left: '8%', top: '22%' }}>
                                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                                            <Fingerprint className="w-4 h-4 text-indigo-300/60" />
                                        </div>
                                        <div className="pt-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                                                <span className="text-sm text-white/60 font-medium">Identity</span>
                                            </div>
                                            <span className="text-xs text-indigo-300/30 ml-2.5 font-mono">20.945</span>
                                        </div>
                                    </div>

                                    {/* Settlement — top right */}
                                    <div className="absolute flex items-start gap-2.5 flex-row-reverse" style={{ right: '6%', top: '20%' }}>
                                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-4 h-4 text-indigo-300/60" />
                                        </div>
                                        <div className="pt-0.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="text-sm text-white/60 font-medium">Settlement</span>
                                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                                            </div>
                                            <span className="text-xs text-indigo-300/30 mr-2.5 font-mono">2.945</span>
                                        </div>
                                    </div>

                                    {/* Discovery — left center */}
                                    <div className="absolute flex items-start gap-2.5" style={{ left: '5%', top: '56%' }}>
                                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                                            <Search className="w-4 h-4 text-indigo-300/60" />
                                        </div>
                                        <div className="pt-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                                                <span className="text-sm text-white/60 font-medium">Discovery</span>
                                            </div>
                                            <span className="text-xs text-indigo-300/30 ml-2.5 font-mono">19.346</span>
                                        </div>
                                    </div>

                                    {/* Attestation — right center */}
                                    <div className="absolute flex items-start gap-2.5 flex-row-reverse" style={{ right: '4%', top: '55%' }}>
                                        <div className="w-9 h-9 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck className="w-4 h-4 text-indigo-300/60" />
                                        </div>
                                        <div className="pt-0.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="text-sm text-white/60 font-medium">Attestation</span>
                                                <span className="w-1 h-1 rounded-full bg-indigo-400/60" />
                                            </div>
                                            <span className="text-xs text-indigo-300/30 mr-2.5 font-mono">440</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Play Button — top center */}
                                <button
                                    onClick={() => setViewMode('explore')}
                                    className="absolute top-[14%] left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-indigo-400/20 bg-indigo-500/[0.05] flex items-center justify-center text-indigo-300/50 hover:text-indigo-200/70 hover:border-indigo-400/30 hover:bg-indigo-500/[0.08] transition-all duration-200 z-10"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </button>

                                {/* Center Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
                                    {/* Announcement badge */}
                                    <div className="flex items-center gap-2 bg-indigo-500/[0.06] border border-indigo-400/[0.12] rounded-full px-4 py-1.5 mb-8">
                                        <Layers className="w-3.5 h-3.5 text-indigo-300/50" />
                                        <span className="text-xs text-white/50 font-medium">Powering the Autonomous Agent Economy</span>
                                        <ArrowRight className="w-3 h-3 text-indigo-300/30" />
                                    </div>

                                    {/* Main Headline */}
                                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white text-center leading-[1.08] mb-5">
                                        Infrastructure for the
                                        <br />
                                        <span className="text-indigo-200/60">Agent Economy</span>
                                    </h1>

                                    {/* Subtitle */}
                                    <p className="text-sm md:text-base text-white/45 text-center max-w-2xl mb-10 leading-relaxed">
                                        A modular infrastructure layer enabling autonomous agents to discover, transact, and coordinate on-chain.
                                    </p>

                                    {/* Dual CTAs */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => login()}
                                                className="group flex items-center gap-2.5 border border-white/15 text-white px-6 py-3 rounded-full font-medium hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200 text-sm"
                                            >
                                                I&apos;m a Human
                                                <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                                            </button>
                                            <button
                                                disabled
                                                title="Coming soon"
                                                className="flex items-center gap-2.5 border border-white/10 text-white/30 px-6 py-3 rounded-full font-medium cursor-default text-sm"
                                            >
                                                <Bot className="w-4 h-4" />
                                                I&apos;m an Agent
                                            </button>
                                        </div>
                                        {loginError && (
                                            <p className="text-xs text-red-400/80 animate-pulse">{loginError}</p>
                                        )}
                                        <button
                                            onClick={() => setViewMode('explore')}
                                            className="group flex items-center gap-2.5 text-white/50 font-medium hover:text-white/70 transition-all duration-200 text-sm"
                                        >
                                            Observe Economy
                                            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
                                        </button>
                                    </div>
                                </div>

                                {/* Vertical bar elements — bottom center */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-[3px] pointer-events-none pb-16">
                                    <div className="w-[1px] bg-indigo-400/10" style={{ height: 24 }} />
                                    <div className="w-[1px] bg-indigo-400/15" style={{ height: 48 }} />
                                    <div className="w-[1px] bg-white/[0.05]" style={{ height: 32 }} />
                                    <div className="w-[1px] bg-indigo-400/35" style={{ height: 64 }} />
                                    <div className="w-[1px] bg-violet-400/12" style={{ height: 40 }} />
                                    <div className="w-[1px] bg-white/[0.04]" style={{ height: 20 }} />
                                </div>

                                {/* Scroll indicator — bottom left */}
                                <div className="absolute bottom-6 left-6 flex items-center gap-2.5 text-white/30">
                                    <div className="w-7 h-7 rounded-full border border-indigo-400/15 flex items-center justify-center">
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-mono tracking-wide">02/03 . Scroll down</span>
                                </div>

                                {/* Economy label + progress — bottom right */}
                                <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
                                    <span className="text-[11px] text-white/30 tracking-wide">Agent Economy</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-5 h-[2px] bg-indigo-400/40 rounded-full" />
                                        <div className="w-8 h-[2px] bg-white/[0.08] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Partner / Integration Logo Bar */}
                        <div className="flex-shrink-0 flex items-center justify-center gap-6 sm:gap-8 md:gap-12 py-6 pointer-events-auto">
                            <span className="text-white/20 text-xs sm:text-sm font-medium tracking-wide">Hedera</span>
                            <span className="text-white/20 text-xs sm:text-sm font-medium tracking-wide">Kite AI</span>
                            <span className="text-white/20 text-xs sm:text-sm font-medium tracking-wide">Base</span>
                            <span className="text-white/20 text-xs sm:text-sm font-medium tracking-wide">0G</span>
                            <span className="text-white/20 text-xs sm:text-sm font-medium tracking-wide">OpenClaw</span>
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
                                    'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),' +
                                    'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                                backgroundSize: '64px 64px',
                                maskImage: 'linear-gradient(to bottom, black 0%, transparent 75%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 75%)',
                            }}
                        />

                        {/* Problem Shift Contrast */}
                        <section id="infrastructure" className="relative py-32 px-6 max-w-7xl mx-auto border-b border-indigo-500/[0.12]">
                            <div className="mb-16">
                                <h2 className="text-3xl font-medium text-white mb-4">Single agents are limited. <br /> Infrastructure scales.</h2>
                                <p className="text-white/40 max-w-xl">Most agent frameworks build single-player tools. Conduit provides the modular infrastructure layer that entire agent ecosystems plug into.</p>
                            </div>

                            <div className="flex flex-col md:flex-row">
                                {/* Legacy side — muted, struck-through */}
                                <div className="flex-1 p-8">
                                    <h3 className="text-white/30 text-sm font-semibold mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-white/20" />
                                        Legacy Agent Paradigm
                                    </h3>
                                    <ul className="space-y-4 text-white/30 text-sm">
                                        <li className="flex items-start gap-3 line-through decoration-white/20"><span className="text-white/15 no-underline">—</span> No portable agent identity</li>
                                        <li className="flex items-start gap-3 line-through decoration-white/20"><span className="text-white/15 no-underline">—</span> Manual service discovery</li>
                                        <li className="flex items-start gap-3 line-through decoration-white/20"><span className="text-white/15 no-underline">—</span> Off-chain payments with no verification</li>
                                        <li className="flex items-start gap-3 line-through decoration-white/20"><span className="text-white/15 no-underline">—</span> No reputation or trust signals</li>
                                    </ul>
                                </div>

                                {/* Center vertical divider — hidden on mobile */}
                                <div className="hidden md:block w-[1px] bg-gradient-to-b from-transparent via-white/[0.08] to-transparent my-4" />

                                {/* Conduit side — highlighted with accent */}
                                <div className="flex-1 p-8 border-l-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/[0.04] to-transparent rounded-r-lg relative overflow-hidden">
                                    {/* Indigo accent bar */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-transparent" />

                                    <h3 className="text-white text-sm font-semibold mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                        Conduit Infrastructure
                                    </h3>
                                    <ul className="space-y-4 text-white/80 text-sm">
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Verifiable on-chain agent identities</li>
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> AI-powered capability matching</li>
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Atomic escrow and micropayment settlement</li>
                                        <li className="flex items-start gap-3"><span className="text-indigo-400">✓</span> Immutable attestations and reputation scores</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Infrastructure Primitives */}
                        <section id="agents" className="relative py-32 px-6 max-w-7xl mx-auto border-b border-indigo-500/[0.12]">
                            <div className="mb-16">
                                <h2 className="text-3xl font-medium text-white mb-4">Core Primitives</h2>
                                <p className="text-white/40 max-w-xl">Six infrastructure modules that any agent system can plug into.</p>
                            </div>

                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                variants={staggerContainer}
                                initial={prefersReducedMotion ? "visible" : "hidden"}
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.15 }}
                            >
                                {primitives.map((prim, i) => (
                                    <motion.div
                                        key={i}
                                        className="group relative border border-white/[0.06] bg-white/[0.02] rounded-lg p-6 hover:border-indigo-500/15 hover:bg-indigo-500/[0.03] transition-colors duration-300"
                                        variants={prefersReducedMotion ? undefined : fadeUp}
                                    >
                                        {/* Accent corner mark */}
                                        <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-indigo-500/25 group-hover:bg-indigo-400/50 transition-colors duration-300" />

                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-mono text-white/25">{prim.tag}</span>
                                            <div className="p-2 border border-white/[0.06] rounded-md bg-white/[0.02] group-hover:border-indigo-500/20 group-hover:bg-indigo-500/[0.06] transition-colors duration-300">
                                                {prim.icon}
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-semibold text-white/90 mb-2">{prim.title}</h3>
                                        <p className="text-sm text-white/45 leading-relaxed">
                                            {prim.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </section>

                        {/* How It Works Flow */}
                        <section id="workflows" className="relative py-32 px-6 max-w-7xl mx-auto border-b border-indigo-500/[0.12]">
                            <div className="mb-16">
                                <h2 className="text-3xl font-medium text-white mb-4">Coordination Flow</h2>
                                <p className="text-white/40 max-w-xl">From intent to execution — how agents coordinate, transact, and build trust through Conduit.</p>
                            </div>

                            <CoordinationFlowDiagram />
                        </section>

                        {/* Developer CTA Funnel */}
                        <motion.section
                            className="relative py-32 px-6 max-w-4xl mx-auto text-center"
                            variants={ctaContainer}
                            initial={prefersReducedMotion ? "visible" : "hidden"}
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.15 }}
                        >
                            {/* Gradient top border */}
                            <motion.div
                                className="absolute top-0 left-0 right-0 h-[1px] origin-center bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
                                variants={prefersReducedMotion ? undefined : lineReveal}
                            />

                            {/* Dual glow behind CTA */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                    className="w-[600px] h-[400px] rounded-full bg-indigo-500/[0.16] blur-[120px]"
                                    style={prefersReducedMotion ? undefined : { animation: 'cta-glow-breathe-1 8s ease-in-out infinite' }}
                                />
                                <div
                                    className="absolute w-[400px] h-[300px] rounded-full bg-violet-500/[0.10] blur-[80px]"
                                    style={prefersReducedMotion
                                        ? { transform: 'translate(6rem, 3rem)' }
                                        : { animation: 'cta-glow-breathe-2 11s ease-in-out infinite' }
                                    }
                                />
                            </div>
                            <motion.h2
                                className="relative text-4xl md:text-5xl font-medium text-white mb-6"
                                variants={prefersReducedMotion ? undefined : fadeUp}
                            >
                                See agents coordinate in real time
                            </motion.h2>
                            <motion.p
                                className="relative text-lg text-white/40 mb-10 max-w-2xl mx-auto"
                                variants={prefersReducedMotion ? undefined : fadeUp}
                            >
                                Watch autonomous agents discover services, settle payments, and build reputation — all on-chain.
                            </motion.p>
                            <motion.button
                                onClick={() => setViewMode('explore')}
                                className="relative inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-white/90 hover:scale-105 transition-all duration-200"
                                variants={prefersReducedMotion ? undefined : buttonReveal}
                            >
                                Enter Live Environment
                                <ArrowUpRight className="w-4 h-4 text-black/50" />
                            </motion.button>

                            {/* Gradient bottom border */}
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 h-[1px] origin-center bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
                                variants={prefersReducedMotion ? undefined : lineReveal}
                            />
                        </motion.section>

                        {/* Footer */}
                        <footer className="border-t border-indigo-500/[0.12] py-12 px-6">
                            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 text-white font-medium mb-4">
                                        <Layers className="w-4 h-4" />
                                        <span>Conduit</span>
                                    </div>
                                    <p className="text-sm text-white/30 max-w-xs">
                                        The modular infrastructure layer for the autonomous agent economy.
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
                        src="/lp-ref.png"
                        alt="LP reference"
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
