import { cookies } from "next/headers";
import { privy } from "@/lib/privy";
import type { User, LoginMethod } from "@/lib/types";
import { UserRole } from "@/lib/types";

export type AuthUser = User;

/**
 * Determine how the user signed up by inspecting linked accounts.
 * Priority: google > github > email > wallet
 */
function detectLoginMethod(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: any[],
): LoginMethod {
  if (accounts.some((a) => a.type === "google_oauth")) return "google";
  if (accounts.some((a) => a.type === "github_oauth")) return "github";
  if (accounts.some((a) => a.type === "email")) return "email";
  return "wallet";
}

/**
 * Verifies the Privy identity token from cookies and builds
 * a User object entirely from Privy data (including custom_metadata).
 * Returns null if unauthenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("privy-id-token")?.value;

  if (!idToken) return null;

  try {
    const privyUser = await privy.users().get({ id_token: idToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = privyUser.linked_accounts as any[];

    const loginMethod = detectLoginMethod(accounts);

    const emailAccount = accounts.find((a) => a.type === "email");
    const googleAccount = accounts.find((a) => a.type === "google_oauth");
    const githubAccount = accounts.find((a) => a.type === "github_oauth");
    const walletAccount = accounts.find((a) => a.type === "wallet");

    const email =
      (emailAccount?.address as string | undefined) ??
      (googleAccount?.email as string | undefined) ??
      null;

    const walletAddress =
      (walletAccount?.address as string | undefined) ?? null;

    // Read onboarding state from Privy custom_metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (privyUser as any).custom_metadata as
      | Record<string, unknown>
      | undefined;

    const isWalletOnly = loginMethod === "wallet";

    const displayName =
      (meta?.display_name as string | undefined) ??
      (googleAccount?.name as string | undefined) ??
      (githubAccount?.username as string | undefined) ??
      (emailAccount?.address as string | undefined) ??
      null;

    const onboarded = isWalletOnly ? true : meta?.onboarded === true;

    return {
      id: privyUser.id,
      email,
      display_name: displayName,
      wallet_address: walletAddress,
      role: UserRole.USER,
      login_method: loginMethod,
      onboarded,
    };
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

/**
 * Like getAuthUser but throws if unauthenticated.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
