interface HeroNetworkSvgProps {
    prefersReducedMotion: boolean | null;
}

export default function HeroNetworkSvg({ prefersReducedMotion }: HeroNetworkSvgProps) {
    return (
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

            {/* Base static curves */}
            <path id="curve-identity" d="M 160 210 C 300 170, 420 310, 560 350" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
            <path id="curve-settlement" d="M 1050 200 C 900 170, 780 310, 640 350" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
            <path id="curve-discovery" d="M 140 480 C 280 500, 420 410, 560 380" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
            <path id="curve-attestation" d="M 1080 460 C 940 490, 800 410, 650 380" stroke="rgba(99,102,241,0.16)" strokeWidth="1" fill="none" />
            <path id="curve-left-vert" d="M 145 230 C 135 310, 130 390, 130 460" stroke="rgba(99,102,241,0.12)" strokeWidth="1" fill="none" />
            <path id="curve-right-vert" d="M 1070 220 C 1080 310, 1090 390, 1090 440" stroke="rgba(99,102,241,0.12)" strokeWidth="1" fill="none" />

            {!prefersReducedMotion && (<>
                {/* Animated dashed flow overlays */}
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

                {/* Traveling glow pulses */}
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

                <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                    <animateMotion dur="4.5s" repeatCount="indefinite" begin="2.0s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                        <mpath xlinkHref="#curve-left-vert" />
                    </animateMotion>
                </circle>

                <circle r="4" fill="url(#pulse-glow-gradient)" opacity="0.5" filter="url(#pulse-glow-filter)">
                    <animateMotion dur="4.5s" repeatCount="indefinite" begin="3.3s" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.6 1">
                        <mpath xlinkHref="#curve-right-vert" />
                    </animateMotion>
                </circle>
            </>)}
        </svg>
    );
}
