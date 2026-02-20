import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", database: "disconnected" },
      { status: 503 },
    );
  }
}
