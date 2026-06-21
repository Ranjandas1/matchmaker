import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const NOTES_FILE = path.join(process.cwd(), "data", "notes.json");

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

interface ClientState {
  stage: string;
  notes: Note[];
}

interface NotesDB {
  [clientId: string]: ClientState;
}

async function readDB(): Promise<NotesDB> {
  try {
    const data = await fs.readFile(NOTES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writeDB(db: NotesDB) {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(NOTES_FILE), { recursive: true });
  await fs.writeFile(NOTES_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await readDB();

    // Default values if no entry exists
    const clientState = db[id] || {
      stage: "Onboarding",
      notes: [],
    };

    return NextResponse.json(clientState);
  } catch (error: any) {
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

    const db = await readDB();
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
    await writeDB(db);

    return NextResponse.json(clientState);
  } catch (error: any) {
    console.error("Error writing client notes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
