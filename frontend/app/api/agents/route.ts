import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { AgentRole, AgentStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role") as AgentRole | null;
  const status = searchParams.get("status") as AgentStatus | null;

  const supabase = getSupabase();
  let query = supabase
    .from("agents")
    .select("*, owner:users!owner_id(id, display_name)")
    .order("created_at", { ascending: false });

  if (role && Object.values(AgentRole).includes(role)) {
    query = query.eq("role", role);
  }
  if (status && Object.values(AgentStatus).includes(status)) {
    query = query.eq("status", status);
  }

  const { data: agents, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, role, capabilities, metadata } = body;

  if (!name || !role) {
    return NextResponse.json(
      { error: "name and role are required" },
      { status: 400 },
    );
  }

  if (!Object.values(AgentRole).includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${Object.values(AgentRole).join(", ")}` },
      { status: 400 },
    );
  }

  const supabase = getSupabase();
  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      name,
      description: description ?? null,
      role,
      capabilities: capabilities ?? [],
      metadata: metadata ?? null,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agent }, { status: 201 });
}
