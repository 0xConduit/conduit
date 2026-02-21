import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';

interface FloatingNavProps {
    isScrolled: boolean;
    prefersReducedMotion: boolean | null;
    authenticated: boolean;
    onDashboard: () => void;
    onObserve: () => void;
}

export default function FloatingNav({ isScrolled, prefersReducedMotion, authenticated, onDashboard, onObserve }: FloatingNavProps) {
    return (
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
                    top: 0, maxWidth: 1280, backgroundColor: 'rgba(10, 10, 12, 0)',
                    borderRadius: 0, boxShadow: '0 0 0 0 rgba(0,0,0,0)', borderColor: 'rgba(255, 255, 255, 0)',
                },
                island: {
                    top: 16, maxWidth: 1152, backgroundColor: 'rgba(10, 11, 20, 0.88)',
                    borderRadius: 9999, boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)',
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
                <div className="flex-1 flex items-center gap-0 text-white font-medium tracking-tight">
                    <img src="/conduit-logo.png" alt="Conduit" className="h-24 flex-shrink-0 -mr-3" />
                    <span className="tracking-tight text-base md:text-lg">Conduit</span>
                </div>

                <div className="hidden md:flex flex-1 items-center justify-center gap-8 text-base font-medium text-white/50">
                    <a href="#agents" className="hover:text-white transition-colors">Agents</a>
                    <a href="#workflows" className="hover:text-white transition-colors">Workflows</a>
                </div>

                <div className="flex-1 flex items-center justify-end gap-4">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">
                        <Github className="w-4 h-4" />
                    </a>
                    {authenticated ? (
                        <button
                            onClick={onDashboard}
                            className={`group flex items-center gap-2 text-xs font-medium transition-colors duration-300 uppercase tracking-widest px-4 py-2 rounded-full
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
                            onClick={onObserve}
                            className={`group flex items-center gap-2 text-xs font-medium transition-colors duration-300 uppercase tracking-widest px-4 py-2 rounded-full
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
    );
}
