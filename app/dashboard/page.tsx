import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
// import { getExpandedProfiles } from "@/lib/matchmaker";
import { DashboardClient } from "@/components/dashboard-client";
import { data } from "@/data/profiles";
import { readNotesDB } from "@/lib/notes-store";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Load profiles from the algorithm core
  const allProfiles = data;
  const clients = allProfiles;

  // Load persistence states
  const db = await readNotesDB();

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
