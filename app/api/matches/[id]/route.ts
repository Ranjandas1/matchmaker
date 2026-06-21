import { NextRequest, NextResponse } from "next/server";
import { getMatchesForClient } from "@/lib/matchmaker";
import { data } from "@/data/profiles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const profiles = data;
    const client = profiles.find((p) => p.id === clientId);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const matches = getMatchesForClient(client);

    return NextResponse.json({ client, matches });
  } catch (error: any) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
