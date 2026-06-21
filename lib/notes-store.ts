import fs from "fs/promises";
import path from "path";

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface ClientState {
  stage: string;
  notes: Note[];
}

export interface NotesDB {
  [clientId: string]: ClientState;
}

const DEFAULT_NOTES_FILE =
  process.env.NODE_ENV === "production"
    ? path.join("/tmp", "matchmaker-notes.json")
    : path.join(process.cwd(), "data", "notes.json");

const NOTES_FILE = process.env.NOTES_FILE_PATH || DEFAULT_NOTES_FILE;

export async function readNotesDB(): Promise<NotesDB> {
  try {
    const data = await fs.readFile(NOTES_FILE, "utf-8");
    return JSON.parse(data) as NotesDB;
  } catch {
    return {};
  }
}

export async function writeNotesDB(db: NotesDB) {
  await fs.mkdir(path.dirname(NOTES_FILE), { recursive: true });
  await fs.writeFile(NOTES_FILE, JSON.stringify(db, null, 2), "utf-8");
}
