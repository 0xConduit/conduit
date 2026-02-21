// Shared motion variants for landing page sections

export const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
};

export const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

export const lineReveal = {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay: 0.1 } }
};

export const ctaContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

export const buttonReveal = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};
