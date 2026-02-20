'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { PrivyProvider, usePrivy, useLogin, useLogout } from '@privy-io/react-auth';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const privyClientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

// Privy app IDs follow the pattern "cm..." or "cl..." — skip provider for obvious placeholders
const isValidPrivyConfig = !!(privyAppId && privyAppId.length > 10 && !privyAppId.includes('placeholder'));

// Unified auth interface consumed by all components
interface AuthState {
    ready: boolean;
    authenticated: boolean;
    user: ReturnType<typeof usePrivy>['user'] | null;
    login: () => void;
    logout: () => Promise<void>;
    loginError: string | null;
    clearLoginError: () => void;
}

const defaultAuth: AuthState = {
    ready: true,
    authenticated: false,
    user: null,
    login: () => { console.warn('Privy not configured. Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local'); },
    logout: async () => {},
    loginError: null,
    clearLoginError: () => {},
};

const AuthContext = createContext<AuthState>(defaultAuth);

export function useAuth() {
    return useContext(AuthContext);
}

/** Bridges usePrivy() into AuthContext when PrivyProvider is present */
function PrivyAuthBridge({ children }: { children: ReactNode }) {
    const { ready, authenticated, user } = usePrivy();
    const [loginError, setLoginError] = useState<string | null>(null);

    const { login } = useLogin({
        onComplete: () => {
            setLoginError(null);
        },
        onError: (error) => {
            console.error('Privy login error:', error);
            // User closing the modal is not a real error
            setLoginError(error === 'exited_auth_flow'
                ? null
                : 'Login failed. Please try again.');
        },
    });

    const { logout } = useLogout();

    const clearLoginError = () => setLoginError(null);

    return (
        <AuthContext.Provider value={{ ready, authenticated, user, login, logout, loginError, clearLoginError }}>
            {children}
        </AuthContext.Provider>
    );
}

export default function Providers({ children }: { children: ReactNode }) {
    if (!isValidPrivyConfig) {
        return (
            <AuthContext.Provider value={defaultAuth}>
                {children}
            </AuthContext.Provider>
        );
    }

    return (
        <PrivyProvider
            appId={privyAppId}
            {...(privyClientId ? { clientId: privyClientId } : {})}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#818cf8',
                    walletList: ['detected_ethereum_wallets', 'metamask', 'phantom', 'coinbase_wallet', 'rainbow', 'wallet_connect'],
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
            }}
        >
            <PrivyAuthBridge>{children}</PrivyAuthBridge>
        </PrivyProvider>
    );
}
