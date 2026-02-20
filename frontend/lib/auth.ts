import { cookies } from "next/headers";
import { privy } from "@/lib/privy";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@/lib/types";

export type AuthUser = User;

/**
 * Verifies the Privy identity token from cookies,
 * then upserts the user into the local DB (JIT sync).
 * Returns the local User record or null if unauthenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("privy-id-token")?.value;

  if (!idToken) return null;

  try {
    const privyUser = await privy.users().get({ id_token: idToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = privyUser.linked_accounts as any[];

    const emailAccount = accounts.find((a) => a.type === "email");
    const googleAccount = accounts.find((a) => a.type === "google_oauth");
    const githubAccount = accounts.find((a) => a.type === "github_oauth");
    const walletAccount = accounts.find((a) => a.type === "wallet");

    const email =
      (emailAccount?.address as string | undefined) ??
      (googleAccount?.email as string | undefined) ??
      null;

    const displayName =
      (googleAccount?.name as string | undefined) ??
      (githubAccount?.username as string | undefined) ??
      (emailAccount?.address as string | undefined) ??
      null;

    const walletAddress =
      (walletAccount?.address as string | undefined) ?? null;

    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from("users")
      .upsert(
        {
          privy_did: privyUser.id,
          email,
          display_name: displayName,
          wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "privy_did" },
      )
      .select()
      .single();

    if (error) throw error;

    return user;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

/**
 * Like getAuthUser but throws if unauthenticated.
 * Use in route handlers where auth is required.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
