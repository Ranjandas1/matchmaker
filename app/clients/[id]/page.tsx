import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMatchesForClient } from "@/lib/matchmaker";
import { ClientDetails } from "@/components/client-details";
import { data } from "@/data/profiles";
import { readNotesDB } from "@/lib/notes-store";

export default async function ClientDetailedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const clientId = parseInt(id, 10);

  if (isNaN(clientId)) {
    redirect("/dashboard");
  }

  const allProfiles = data;
  const client = allProfiles.find((p) => p.id === clientId);

  if (!client) {
    redirect("/dashboard");
  }

  const matches = getMatchesForClient(client);

  const db = await readNotesDB();
  const stringId = String(client.id);
  const clientState = db[stringId] || {
    stage:
      client.status === "Searching" || client.status === "Paused"
        ? "Match Screening"
        : "Onboarding",
    notes: [],
  };

  return (
    <ClientDetails
      client={client}
      matches={matches}
      initialState={clientState}
    />
  );
}
