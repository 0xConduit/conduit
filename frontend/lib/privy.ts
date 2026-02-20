import { PrivyClient } from "@privy-io/node";

const globalForPrivy = globalThis as unknown as { privy: PrivyClient };

export const privy =
  globalForPrivy.privy ??
  new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrivy.privy = privy;
}
