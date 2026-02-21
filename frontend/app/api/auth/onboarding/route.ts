import { cookies } from "next/headers";
import { privy } from "@/lib/privy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("privy-id-token")?.value;

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let privyUser;
  try {
    privyUser = await privy.users().get({ id_token: idToken });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const displayName =
    typeof body?.display_name === "string" ? body.display_name.trim() : "";

  if (!displayName || displayName.length < 1 || displayName.length > 50) {
    return NextResponse.json(
      { error: "display_name must be 1–50 characters" },
      { status: 400 },
    );
  }

  try {
    await privy.users().setCustomMetadata(privyUser.id, {
      custom_metadata: {
        display_name: displayName,
        onboarded: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set custom metadata:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 },
    );
  }
}
