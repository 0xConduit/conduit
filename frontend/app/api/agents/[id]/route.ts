import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { AgentRole, AgentStatus } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = getSupabase();
  const { data: agent, error } = await supabase
    .from("agents")
    .select("*, owner:users!owner_id(id, display_name)")
    .eq("id", id)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = getSupabase();
  const { data: agent, error: fetchError } = await supabase
    .from("agents")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (fetchError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, role, capabilities, status, metadata } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (role !== undefined) {
    if (!Object.values(AgentRole).includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${Object.values(AgentRole).join(", ")}` },
        { status: 400 },
      );
    }
    data.role = role;
  }
  if (capabilities !== undefined) data.capabilities = capabilities;
  if (status !== undefined) {
    if (!Object.values(AgentStatus).includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${Object.values(AgentStatus).join(", ")}` },
        { status: 400 },
      );
    }
    data.status = status;
  }
  if (metadata !== undefined) data.metadata = metadata;
  data.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("agents")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ agent: updated });
}
