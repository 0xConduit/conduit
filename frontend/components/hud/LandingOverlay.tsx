'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Providers';
import { useRouter } from 'next/navigation';
import FloatingNav from '../landing/FloatingNav';
import HeroSection from '../landing/HeroSection';
import PrimitivesGrid from '../landing/PrimitivesGrid';
import CoordinationFlowDiagram from '../landing/CoordinationFlowDiagram';
import DeveloperCTA from '../landing/DeveloperCTA';
import LandingFooter from '../landing/LandingFooter';

export default function LandingOverlay() {
    const setViewMode = useEconomyStore(state => state.setViewMode);
    const { login, authenticated, loginError, clearLoginError, user } = useAuth();
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: scrollContainerRef });

    const [isScrolled, setIsScrolled] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    const opacity = useTransform(scrollY, [0, 500], [1, 0]);
    const yOffset = useTransform(scrollY, [0, 500], [0, 100]);

    useEffect(() => {
        return scrollY.on("change", (latest) => {
            if (latest > 120) setIsScrolled(true);
            else if (latest < 96) setIsScrolled(false);
        });
    }, [scrollY]);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    // Track whether the user was already authenticated when the page loaded.
    // Only redirect on a fresh login (was false → became true), not when
    // navigating back to the landing page while already logged in.
    const wasAuthenticated = useRef(authenticated);
    useEffect(() => {
        if (!wasAuthenticated.current && authenticated) {
            router.push('/dashboard');
        }
        wasAuthenticated.current = authenticated;
    }, [authenticated, router]);

    useEffect(() => {
        if (!loginError) return;
        const timer = setTimeout(() => clearLoginError(), 4000);
        return () => clearTimeout(timer);
    }, [loginError, clearLoginError]);

    // Dev-only reference overlay
    const [showRef, setShowRef] = useState(false);
    const [refOpacity, setRefOpacity] = useState(0.5);
    const refEnabled = process.env.NODE_ENV === 'development'
        && typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).has('ref');

    useEffect(() => {
        if (!refEnabled) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'r' || e.key === 'R') setShowRef(prev => !prev);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [refEnabled]);

    return (
        <div ref={scrollContainerRef} className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden font-sans scroll-smooth pointer-events-auto selection:bg-white/20">
            <div className="fixed inset-0 z-0 bg-[#0a0a0c] pointer-events-none" />

            {!isMounted ? null : (<>
                <FloatingNav
                    isScrolled={isScrolled}
                    prefersReducedMotion={prefersReducedMotion}
                    authenticated={authenticated}
                    walletAddress={user?.wallet?.address}
                    onDashboard={() => router.push('/dashboard')}
                    onObserve={() => setViewMode('explore')}
                />

                <div className="min-h-screen relative flex flex-col pointer-events-none">
                    <HeroSection
                        opacity={opacity}
                        yOffset={yOffset}
                        prefersReducedMotion={prefersReducedMotion}
                        login={login}
                        authenticated={authenticated}
                        loginError={loginError}
                        setViewMode={setViewMode}
                    />

                    <div className="bg-[#0a0a0c] pointer-events-auto w-full relative z-10">
                        <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none" aria-hidden="true" style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0c)' }} />

                        <PrimitivesGrid prefersReducedMotion={prefersReducedMotion} />

                        {/* Coordination Flow */}
                        <div className="relative">
                            <div className="absolute inset-0 pointer-events-none" style={{
                                backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(139,92,246,0.10) 15px, rgba(139,92,246,0.10) 16px, transparent 16px, transparent 32px)',
                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                            }} />
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 40% at 5% 10%, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 40% at 95% 90%, rgba(99,102,241,0.10) 0%, transparent 70%)' }} />
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 35%, rgba(99,102,241,0.07) 45%, rgba(99,102,241,0.07) 55%, transparent 65%)' }} />
                            <section id="workflows" className="relative py-12 px-6 max-w-7xl mx-auto">
                                <div className="mb-4">
                                    <h2 className="text-3xl font-medium text-white mb-4">Coordination Flow</h2>
                                    <p className="text-white/40 max-w-xl">From intent to execution — how agents coordinate, transact, and build trust through Conduit.</p>
                                </div>
                                <CoordinationFlowDiagram />
                            </section>
                        </div>

                        <DeveloperCTA prefersReducedMotion={prefersReducedMotion} setViewMode={setViewMode} />
                        <LandingFooter />
                    </div>
                </div>
            </>)}

            {refEnabled && showRef && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <img src="/lp-ref.png" alt="LP reference" className="w-full h-full object-cover" style={{ opacity: refOpacity }} />
                    <div className="absolute bottom-4 right-4 pointer-events-auto bg-black/80 border border-white/10 rounded-lg px-4 py-3 flex flex-col gap-2 text-xs text-white/70 font-mono">
                        <label className="flex items-center gap-2">
                            Opacity
                            <input type="range" min="0" max="1" step="0.05" value={refOpacity} onChange={(e) => setRefOpacity(parseFloat(e.target.value))} className="w-24" />
                            <span className="w-8 text-right">{refOpacity.toFixed(2)}</span>
                        </label>
                        <span className="text-white/40">Press R to toggle</span>
                    </div>
                </div>
            )}
        </div>
    );
}
