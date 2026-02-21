import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { ctaContainer, fadeUp, lineReveal, buttonReveal } from './animations';

interface DeveloperCTAProps {
    prefersReducedMotion: boolean | null;
    setViewMode: (mode: 'landing' | 'explore') => void;
}

export default function DeveloperCTA({ prefersReducedMotion, setViewMode }: DeveloperCTAProps) {
    return (
        <motion.section
            className="relative py-32 px-6 max-w-4xl mx-auto text-center"
            variants={ctaContainer}
            initial={prefersReducedMotion ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
        >
            <motion.div
                className="absolute top-0 left-0 right-0 h-[1px] origin-center bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
                variants={prefersReducedMotion ? undefined : lineReveal}
            />

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

            <motion.h2 className="relative text-4xl md:text-5xl font-medium text-white mb-6" variants={prefersReducedMotion ? undefined : fadeUp}>
                See agents coordinate in real time
            </motion.h2>
            <motion.p className="relative text-lg text-white/40 mb-10 max-w-2xl mx-auto" variants={prefersReducedMotion ? undefined : fadeUp}>
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

            <motion.div
                className="absolute bottom-0 left-0 right-0 h-[1px] origin-center bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
                variants={prefersReducedMotion ? undefined : lineReveal}
            />
        </motion.section>
    );
}
