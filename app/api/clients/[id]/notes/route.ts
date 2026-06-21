import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readNotesDB, writeNotesDB, type Note } from "@/lib/notes-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await readNotesDB();

    // Default values if no entry exists
    const clientState = db[id] || {
      stage: "Onboarding",
      notes: [],
    };

    return NextResponse.json(clientState);
  } catch (error: unknown) {
    console.error("Error reading client notes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { stage, noteText } = body;

    const db = await readNotesDB();
    const clientState = db[id] || {
      stage: "Onboarding",
      notes: [],
    };

    if (stage) {
      clientState.stage = stage;
    }

    if (noteText && noteText.trim() !== "") {
      const newNote: Note = {
        id: crypto.randomUUID(),
        text: noteText.trim(),
        createdAt: new Date().toISOString(),
      };
      clientState.notes.unshift(newNote);
    }

    db[id] = clientState;
    await writeNotesDB(db);

    return NextResponse.json(clientState);
  } catch (error: unknown) {
    console.error("Error writing client notes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
