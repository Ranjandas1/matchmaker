import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
// import { getExpandedProfiles } from "@/lib/matchmaker";
import { DashboardClient } from "@/components/dashboard-client";
import fs from "fs/promises";
import path from "path";
import { data } from "@/data/profiles";

const NOTES_FILE = path.join(process.cwd(), "data", "notes.json");

// Helper to load notes database
async function getNotesDB() {
  try {
    const data = await fs.readFile(NOTES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Load profiles from the algorithm core
  const allProfiles = data;

  // Designate the first 5 males (IDs 1-5) and the first 5 females (IDs 51-55) as assigned clients
  // const assignedIds = [1, 2, 3, 4, 5, 51, 52, 53, 54, 55];
  // const clients = allProfiles.filter(p => assignedIds.includes(p.id));
  const clients = allProfiles;

  // Load persistence states
  const db = await getNotesDB();

  // Merge client details with their persistent stage and notes count
  const clientsWithJourney = clients.map((client) => {
    const stringId = String(client.id);
    const clientState = db[stringId];

    // Default stage based on their profile status
    let defaultStage = "Onboarding";
    if (client.status === "Searching" || client.status === "Paused") {
      defaultStage = "Match Screening";
    }

    return {
      ...client,
      journeyStage: clientState?.stage || defaultStage,
      notesCount: clientState?.notes?.length || 0,
    };
  });

  return (
    <DashboardClient
      initialClients={clientsWithJourney}
      userEmail={session.user?.email || ""}
      userName={session.user?.name || "Matchmaker"}
    />
  );
}
