"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, Briefcase, 
  Heart, Plus, Clock, Send, Sparkles, Check, 
  User, Languages, Flame, Users,
  CheckCircle2, Compass, AlertCircle
} from "lucide-react";
import { UserProfile } from "@/data/profile";
import { SuggestedMatch } from "@/lib/matchmaker";
import { toast } from "sonner";

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

interface ClientState {
  stage: string;
  notes: Note[];
}

interface ClientDetailsProps {
  client: UserProfile;
  matches: SuggestedMatch[];
  initialState: ClientState;
}

export function ClientDetails({ client, matches, initialState }: ClientDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"biodata" | "matches" | "notes">("biodata");
  const [stage, setStage] = useState(initialState.stage);
  const [notes, setNotes] = useState<Note[]>(initialState.notes);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  // AI Fit states (cached per match ID)
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, string>>({});
  const [aiEmails, setAiEmails] = useState<Record<number, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<number, boolean>>({});

  // Email modal states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SuggestedMatch | null>(null);
  const [emailContent, setEmailContent] = useState("");
  const [sendingMatch, setSendingMatch] = useState(false);

  // Update notes/stage if props change
  useEffect(() => {
    setStage(initialState.stage);
    setNotes(initialState.notes);
  }, [initialState]);

  // Handle stage change
  const handleStageChange = async (newStage: string) => {
    setStage(newStage);
    setSavingStage(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        toast.success(`Journey stage updated to "${newStage}"`);
        router.refresh();
      } else {
        toast.error("Failed to update journey stage");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating journey stage");
    } finally {
      setSavingStage(false);
    }
  };

  // Handle saving notes
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText: newNote }),
      });
      if (res.ok) {
        const updatedState: ClientState = await res.json();
        setNotes(updatedState.notes);
        setNewNote("");
        toast.success("Meeting note recorded successfully");
      } else {
        toast.error("Failed to record meeting note");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving meeting note");
    } finally {
      setSavingNote(false);
    }
  };

  // Request AI Match Fit analysis and pre-composed email
  const handleRequestAiAnalysis = async (match: SuggestedMatch) => {
    const matchId = match.profile.id;
    if (aiAnalysis[matchId]) return; // already loaded

    setLoadingAi(prev => ({ ...prev, [matchId]: true }));
    try {
      const res = await fetch("/api/ai-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          candidate: match.profile,
          matchScore: match.compatibilityScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(prev => ({ ...prev, [matchId]: data.fitAnalysis }));
        setAiEmails(prev => ({ ...prev, [matchId]: data.emailIntro }));
        toast.success(`AI Compatibility analysis loaded for ${match.profile.firstName}`);
      } else {
        toast.error("Failed to generate AI analysis");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error generating AI analysis");
    } finally {
      setLoadingAi(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // Open "Send Match" email modal
  const handleOpenSendMatchModal = async (match: SuggestedMatch) => {
    setSelectedMatch(match);
    const matchId = match.profile.id;

    // Check if AI email is already loaded. If not, load it first
    if (!aiEmails[matchId]) {
      setLoadingAi(prev => ({ ...prev, [matchId]: true }));
      try {
        const res = await fetch("/api/ai-intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client,
            candidate: match.profile,
            matchScore: match.compatibilityScore,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiAnalysis(prev => ({ ...prev, [matchId]: data.fitAnalysis }));
          setAiEmails(prev => ({ ...prev, [matchId]: data.emailIntro }));
          setEmailContent(data.emailIntro);
          setEmailModalOpen(true);
        } else {
          toast.error("Failed to load email introduction");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading email introduction");
      } finally {
        setLoadingAi(prev => ({ ...prev, [matchId]: false }));
      }
    } else {
      setEmailContent(aiEmails[matchId]);
      setEmailModalOpen(true);
    }
  };

  // Trigger Send Match Action
  const handleSendMatchProposal = async () => {
    if (!selectedMatch) return;
    setSendingMatch(true);

    try {
      // Mock email sending: post a new note to the timeline, update stage to "Intro Sent"
      const noteMessage = `Sent match proposal to ${selectedMatch.profile.firstName} ${selectedMatch.profile.lastName} (ID: ${selectedMatch.profile.id}). Score: ${selectedMatch.compatibilityScore}%.`;
      
      const res = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stage: "Intro Sent", 
          noteText: `[Match Proposal Sent] ${noteMessage}\n\nEmail Content sent:\n${emailContent}`
        }),
      });

      if (res.ok) {
        const updatedState: ClientState = await res.json();
        setNotes(updatedState.notes);
        setStage("Intro Sent");
        toast.success(`Match invitation sent to ${selectedMatch.profile.firstName}! Journey stage updated.`);
        setEmailModalOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to record match proposal sending");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending match proposal");
    } finally {
      setSendingMatch(false);
    }
  };

  // Helper for stage badge styling
  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case "Onboarding":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "Match Screening":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "Intro Sent":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "First Date":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20";
      case "Matched":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="flex-1 bg-background text-foreground min-h-screen pb-20 font-sans">
      
      {/* shadcn Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2.5 bg-muted border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-xl transition-all"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-inner"
                style={{ backgroundColor: client.photoColor }}
              >
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  {client.firstName} {client.lastName}
                  <span className="text-sm font-normal text-muted-foreground ml-2">({client.age}, {client.gender})</span>
                </h1>
                <p className="text-xs text-muted-foreground font-light mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground/80" /> {client.city}, India
                </p>
              </div>
            </div>
          </div>

          {/* Stage Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">Stage:</span>
            <div className="relative">
              <select
                value={stage}
                onChange={(e) => handleStageChange(e.target.value)}
                disabled={savingStage}
                className="bg-background border border-input focus:border-primary text-xs font-semibold tracking-wider text-primary rounded-lg px-3.5 py-2 focus:outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors uppercase disabled:opacity-50"
              >
                <option value="Onboarding">Onboarding</option>
                <option value="Match Screening">Match Screening</option>
                <option value="Intro Sent">Intro Sent</option>
                <option value="First Date">First Date</option>
                <option value="Matched">Matched</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-border mb-8 gap-2">
          <button
            onClick={() => setActiveTab("biodata")}
            className={`px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "biodata" 
                ? "border-primary text-primary bg-primary/[0.01]" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Full Biodata
          </button>
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "matches" 
                ? "border-primary text-primary bg-primary/[0.01]" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Potential Matches
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black">
              {matches.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "notes" 
                ? "border-primary text-primary bg-primary/[0.01]" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Call Notes & Timeline
            {notes.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-bold">
                {notes.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "biodata" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col - Personal & Cultural */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info Card */}
              <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2 border-b border-border/80 pb-3">
                  <User className="w-4.5 h-4.5 text-primary" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Full Name</span>
                    <span className="text-foreground font-light">{client.firstName} {client.lastName}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date of Birth (Age)</span>
                    <span className="text-foreground font-light">{client.dob} ({client.age} years old)</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Gender</span>
                    <span className="text-foreground font-light">{client.gender}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Height</span>
                    <span className="text-foreground font-light">{client.heightCm} cm</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Languages Known</span>
                    <span className="text-foreground font-light">{client.languages.join(", ")}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Siblings</span>
                    <span className="text-foreground font-light">{client.siblings}</span>
                  </div>
                </div>
              </div>

              {/* Career & Education Card */}
              <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2 border-b border-border/80 pb-3">
                  <Briefcase className="w-4.5 h-4.5 text-primary" /> Education & Career
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Undergraduate College</span>
                    <span className="text-foreground font-light">{client.college}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Degree Details</span>
                    <span className="text-foreground font-light">{client.degree}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Company</span>
                    <span className="text-foreground font-light">{client.company}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Designation</span>
                    <span className="text-foreground font-light">{client.designation}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Annual Income</span>
                    <span className="text-primary font-semibold">₹{client.incomeLPA} LPA</span>
                  </div>
                </div>
              </div>

              {/* Social and Cultural */}
              <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2 border-b border-border/80 pb-3">
                  <Languages className="w-4.5 h-4.5 text-primary" /> Cultural Background
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Religion</span>
                    <span className="text-foreground font-light">{client.religion}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Caste / Sub-Caste</span>
                    <span className="text-foreground font-light">{client.caste}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mother Tongue</span>
                    <span className="text-foreground font-light">{client.motherTongue}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Manglik Status</span>
                    <span className="text-foreground font-light">{client.manglik}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col - Contact & Lifestyle Preferences */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2 border-b border-border/80 pb-3">
                  <Users className="w-4.5 h-4.5 text-primary" /> Contact Details
                </h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Address</span>
                    <span className="text-foreground font-light select-all">{client.email}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone Number</span>
                    <span className="text-foreground font-light select-all">{client.phone}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Location</span>
                    <span className="text-foreground font-light">{client.city}, {client.country}</span>
                  </div>
                </div>
              </div>

              {/* Lifestyle Preferences */}
              <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2 border-b border-border/80 pb-3">
                  <Flame className="w-4.5 h-4.5 text-primary" /> Lifestyle & Lifestyle Preferences
                </h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dietary Preference</span>
                    <span className="text-foreground font-light">{client.dietPreference}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Drinking Habits</span>
                    <span className="text-foreground font-light">{client.drinkingHabits}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Smoking Habits</span>
                    <span className="text-foreground font-light">{client.smokingHabits}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hobbies</span>
                    <span className="text-foreground font-light">{client.hobbies}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Family Setup</span>
                    <span className="text-foreground font-light">{client.familyType} Setup • {client.familyValues} Values</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border">
                    <div className="text-center bg-muted/40 p-2 rounded-xl border border-border">
                      <span className="block text-[8px] text-muted-foreground uppercase font-bold">Kids?</span>
                      <span className="text-xs text-foreground font-medium">{client.wantKids}</span>
                    </div>
                    <div className="text-center bg-muted/40 p-2 rounded-xl border border-border">
                      <span className="block text-[8px] text-muted-foreground uppercase font-bold">Relocate?</span>
                      <span className="text-xs text-foreground font-medium">{client.openToRelocate}</span>
                    </div>
                    <div className="text-center bg-muted/40 p-2 rounded-xl border border-border">
                      <span className="block text-[8px] text-muted-foreground uppercase font-bold">Pets?</span>
                      <span className="text-xs text-foreground font-medium">{client.openToPets}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "matches" && (
          <div className="space-y-5">
            
            {/* Tab header */}
            <div>
              <h2 className="text-lg font-bold text-foreground">Scored Match Suggestions</h2>
              <p className="text-xs text-muted-foreground font-light mt-0.5">
                Evaluated against opposite-gender profiles in the pool. Strictly matching parameters prioritized first.
              </p>
            </div>

            {/* Matches list */}
            <div className="space-y-5">
              {matches.map((match) => {
                const matchId = match.profile.id;
                const score = match.compatibilityScore;
                
                // Compatibility badge styling
                let badgeColor = "bg-muted text-muted-foreground border border-border";
                let badgeText = "Potential Match";
                if (score >= 85) {
                  badgeColor = "bg-primary/10 text-primary border border-primary/20";
                  badgeText = "High Potential Match";
                } else if (score >= 70) {
                  badgeColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
                  badgeText = "Moderate Match";
                }

                return (
                  <div 
                    key={matchId}
                    className="relative overflow-hidden bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Match Card Top Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4 mb-4">
                      
                      {/* Left: Avatar & quick bio */}
                      <div className="flex items-center gap-3.5">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-inner shrink-0"
                          style={{ backgroundColor: match.profile.photoColor }}
                        >
                          {match.profile.firstName[0]}{match.profile.lastName[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                            {match.profile.firstName} {match.profile.lastName}
                            <span className="text-xs font-normal text-muted-foreground">({match.profile.age})</span>
                          </h3>
                          <p className="text-xs text-muted-foreground font-light flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground/75" /> {match.profile.city} • <Briefcase className="w-3.5 h-3.5 text-muted-foreground/75" /> {match.profile.designation} at {match.profile.company}
                          </p>
                        </div>
                      </div>

                      {/* Right: Score and Tags */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg ${badgeColor}`}>
                            {badgeText}
                          </span>
                          {match.strictMatch && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Strict Match
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-black text-primary tracking-tight">{score}%</span>
                          <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold block leading-none">Match<br/>Score</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
                      
                      {/* Left: Quick Details list */}
                      <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Education:</span>
                          <span className="text-foreground font-medium">{match.profile.degree} ({match.profile.college})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Income:</span>
                          <span className="text-primary font-semibold">₹{match.profile.incomeLPA} LPA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Culture:</span>
                          <span className="text-foreground font-medium">{match.profile.religion} • {match.profile.caste}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lifestyle:</span>
                          <span className="text-foreground font-medium">{match.profile.dietPreference} • Manglik: {match.profile.manglik}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Habits:</span>
                          <span className="text-foreground font-medium">Drink: {match.profile.drinkingHabits} • Smoke: {match.profile.smokingHabits}</span>
                        </div>
                      </div>

                      {/* Middle: Score Progress Bars */}
                      <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 text-[9px] space-y-2.5 justify-center flex flex-col">
                        <h4 className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold border-b border-border/40 pb-1 flex items-center justify-between">
                          <span>Compatibility Metrics</span>
                          <Compass className="w-3.5 h-3.5 text-muted-foreground" />
                        </h4>
                        
                        {/* location */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-muted-foreground font-light">
                            <span>Location Fit</span>
                            <span className="font-semibold text-foreground">{match.breakdown.location}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${match.breakdown.location}%` }} />
                          </div>
                        </div>

                        {/* financial */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-muted-foreground font-light">
                            <span>Income & Career</span>
                            <span className="font-semibold text-foreground">{match.breakdown.financial}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${match.breakdown.financial}%` }} />
                          </div>
                        </div>

                        {/* values */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-muted-foreground font-light">
                            <span>Cultural & Values Alignment</span>
                            <span className="font-semibold text-foreground">{match.breakdown.values}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${match.breakdown.values}%` }} />
                          </div>
                        </div>

                        {/* lifestyle */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-muted-foreground font-light">
                            <span>Habits & Lifestyle</span>
                            <span className="font-semibold text-foreground">{match.breakdown.lifestyle}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.breakdown.lifestyle}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Right: Heuristic Match Reasons list */}
                      <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 text-xs flex flex-col justify-between">
                        <div>
                          <h4 className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold border-b border-border/40 pb-1 mb-2 flex items-center justify-between">
                            <span>Key Compatibility Highlights</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </h4>
                          <ul className="space-y-1">
                            {match.matchReasons.slice(0, 4).map((reason, idx) => (
                              <li key={idx} className="text-foreground font-light flex items-start gap-1 leading-tight">
                                <span className="text-emerald-500 shrink-0 select-none">✓</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* AI Fit Section & Action Button */}
                    <div className="border-t border-border pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/40 -mx-5 -mb-5 px-5 py-3.5 rounded-b-2xl">
                      
                      {/* AI fit analysis */}
                      <div className="flex-1 text-xs text-muted-foreground">
                        {aiAnalysis[matchId] ? (
                          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex gap-2 shadow-sm text-foreground">
                            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-[9px] uppercase tracking-wider text-primary block mb-0.5">AI Matchmaker's Fit Analysis</span>
                              <p className="font-light leading-relaxed">{aiAnalysis[matchId]}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground pl-0.5 font-light italic">
                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/85" /> Click "Request AI Review" to generate LLM-backed compatibility insights.
                          </div>
                        )}
                      </div>

                      {/* Match Actions buttons */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        {!aiAnalysis[matchId] && (
                          <button
                            onClick={() => handleRequestAiAnalysis(match)}
                            disabled={loadingAi[matchId]}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent border border-border rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                            {loadingAi[matchId] ? "Analyzing..." : "Request AI Review"}
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenSendMatchModal(match)}
                          disabled={loadingAi[matchId]}
                          className="flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          Send Match
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols - Notes timeline */}
            <div className="lg:col-span-2 space-y-5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-primary" /> Call & Interaction History
              </h2>

              {notes.length === 0 ? (
                <div className="text-center py-16 bg-muted/40 border border-dashed border-border rounded-2xl">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2.5" />
                  <p className="text-muted-foreground text-sm font-light">No call notes recorded yet. Add notes to track progress.</p>
                </div>
              ) : (
                <div className="relative border-l border-border pl-6 ml-3 space-y-6">
                  {notes.map((note) => {
                    const isSystem = note.text.startsWith("[Match Proposal Sent]");
                    const cleanText = isSystem 
                      ? note.text.replace("[Match Proposal Sent] ", "") 
                      : note.text;
                    const cleanDate = new Date(note.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });

                    return (
                      <div key={note.id} className="relative">
                        {/* Timeline point */}
                        <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border ${
                          isSystem 
                            ? "bg-primary border-primary" 
                            : "bg-background border-muted-foreground"
                        }`} />
                        
                        <div className={`rounded-xl p-4.5 text-sm bg-card border border-border ${
                          isSystem ? "bg-primary/[0.01]" : ""
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[9px] uppercase font-bold tracking-wider ${
                              isSystem ? "text-primary" : "text-muted-foreground"
                            }`}>
                              {isSystem ? "Match Proposal Sent" : "Call Note"}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-light">{cleanDate}</span>
                          </div>
                          <p className="text-foreground font-light leading-relaxed whitespace-pre-wrap">{cleanText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col - Add note form */}
            <div>
              <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 sticky top-32 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" /> Record Call Details
                </h3>
                
                <form onSubmit={handleSaveNote} className="space-y-4.5">
                  <textarea
                    placeholder="Type details from call or meeting (e.g. preferences, feedback on matches, next steps...)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                    rows={6}
                    className="w-full bg-background border border-input hover:border-accent-foreground/25 focus:border-primary rounded-xl p-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none transition-all resize-none leading-relaxed"
                  />
                  
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    {savingNote ? "Recording..." : "Record Note"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Match Email Modal Dialog */}
      {emailModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-350">
          <div className="bg-background border border-border rounded-2xl w-full max-w-xl overflow-hidden shadow-lg flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-350 text-foreground">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Send className="w-4.5 h-4.5" />
                <h3 className="text-base font-bold text-foreground">Send Match Proposal</h3>
              </div>
              <button 
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="bg-muted border border-border p-3.5 rounded-xl text-xs space-y-1 text-muted-foreground">
                <p><span className="font-semibold text-foreground">Client:</span> {client.firstName} {client.lastName} ({client.email})</p>
                <p><span className="font-semibold text-foreground">Match Candidate:</span> {selectedMatch.profile.firstName} {selectedMatch.profile.lastName} (Age {selectedMatch.profile.age}, {selectedMatch.profile.city})</p>
                <p><span className="font-semibold text-foreground">Compatibility Score:</span> {selectedMatch.compatibilityScore}% Match</p>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold pl-0.5">Email Draft (Edit prior to sending)</label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={12}
                  className="w-full bg-background border border-input focus:border-primary rounded-xl p-3.5 text-xs font-mono text-foreground focus:outline-none transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-muted/40 border-t border-border flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMatchProposal}
                disabled={sendingMatch || !emailContent.trim()}
                className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {sendingMatch ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Confirm & Send Match
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
