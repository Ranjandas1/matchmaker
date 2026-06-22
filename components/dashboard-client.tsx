"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Users,
  CheckCircle,
  Heart,
  MapPin,
  Briefcase,
  MessageSquare,
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
  UserCheck,
} from "lucide-react";
import { UserProfile } from "@/data/profile";

interface ClientWithJourney extends UserProfile {
  journeyStage: string;
  notesCount: number;
}

interface DashboardClientProps {
  initialClients: ClientWithJourney[];
  userEmail: string;
  userName: string;
}

export function DashboardClient({
  initialClients,
  userEmail,
  userName,
}: DashboardClientProps) {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Filtering Logic
  const filteredClients = initialClients.filter((client) => {
    const matchesSearch =
      `${client.firstName} ${client.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      client.city.toLowerCase().includes(search.toLowerCase());

    const matchesGender =
      genderFilter === "All" || client.gender === genderFilter;
    const matchesStage =
      stageFilter === "All" || client.journeyStage === stageFilter;
    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;

    return matchesSearch && matchesGender && matchesStage && matchesStatus;
  });

  // Calculate Metrics
  const totalClients = initialClients.length;
  const activeMatching = initialClients.filter(
    (c) => c.journeyStage !== "Matched" && c.status !== "Inactive",
  ).length;
  const matchedCount = initialClients.filter(
    (c) => c.journeyStage === "Matched",
  ).length;
  const noteTotal = initialClients.reduce((acc, c) => acc + c.notesCount, 0);

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

  // Helper for status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/20 text-emerald-500 rounded-full w-2 h-2 inline-block mr-1.5";
      case "Searching":
        return "bg-sky-500/20 text-sky-500 rounded-full w-2 h-2 inline-block mr-1.5";
      case "Paused":
        return "bg-amber-500/20 text-amber-500 rounded-full w-2 h-2 inline-block mr-1.5";
      default:
        return "bg-slate-500/20 text-slate-500 rounded-full w-2 h-2 inline-block mr-1.5";
    }
  };

  return (
    <div className="flex-1 bg-background text-foreground min-h-screen pb-16 font-sans">
      {/* shadcn Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 fill-current animate-pulse text-rose-500" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                TDC Matchmaker
              </span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Internal Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end border-r border-border pr-4">
              <span className="text-sm font-medium text-foreground">
                {userName}
              </span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider border border-destructive/20 rounded-lg cursor-pointer transition-colors duration-200 text-destructive hover:bg-destructive hover:text-black hover:border-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Matchmaker Workspace
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-light">
            Review client journey stages, calculate matches, and record meeting
            feedback.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1 */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-muted rounded-xl text-primary border border-border/40">
                <Users className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Active Roster
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalClients}</p>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
              Clients Assigned
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-muted rounded-xl text-primary border border-border/40">
                <UserCheck className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                Matching
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {activeMatching}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
              In Matching Journey
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-muted rounded-xl text-primary border border-border/40">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Success
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{matchedCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
              Matched & Settled
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-muted rounded-xl text-primary border border-border/40">
                <MessageSquare className="w-5 h-5 text-sky-500" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                Interactions
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{noteTotal}</p>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
              Call Notes History
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-sm">
          {/* Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search client name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-input hover:border-accent-foreground/25 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Select Dropdowns */}
          <div className="flex flex-wrap gap-4 w-full lg:w-auto items-center justify-end">
            {/* Gender filter */}
            <div className="flex flex-col gap-0.5 w-30 sm:w-32.5">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold pl-0.5">
                Gender
              </span>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Stage filter */}
            <div className="flex flex-col gap-0.5 w-35 sm:w-37.5">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold pl-0.5">
                Journey Stage
              </span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <option value="All">All Stages</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Match Screening">Match Screening</option>
                <option value="Intro Sent">Intro Sent</option>
                <option value="First Date">First Date</option>
                <option value="Matched">Matched</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex flex-col gap-0.5 w-30 sm:w-32.5">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold pl-0.5">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Searching">Searching</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
          </div>
        </div>

        {/* Client List Grid */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-20 bg-muted/40 border border-dashed border-border rounded-2xl">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              No clients match your filter criteria.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setGenderFilter("All");
                setStageFilter("All");
                setStatusFilter("All");
              }}
              className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredClients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div
                  key={client.id}
                  className="group relative overflow-hidden bg-card text-card-foreground border border-border hover:border-primary/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-inner shrink-0"
                          style={{ backgroundColor: client.photoColor }}
                        >
                          {client.firstName[0]}
                          {client.lastName[0]}
                        </div>

                        {/* Name, age, designation */}
                        <div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {client.firstName} {client.lastName}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({client.age})
                            </span>
                          </h3>
                          <p className="text-muted-foreground text-xs font-light flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground/75" />
                            {client.designation} at{" "}
                            <span className="font-normal text-foreground/80">
                              {client.company}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="text-xs bg-muted border border-border px-2.5 py-1 rounded-lg flex items-center shadow-sm">
                        <span className={getStatusBadgeClass(client.status)} />
                        <span className="text-foreground font-bold text-[9px] tracking-wider uppercase">
                          {client.status}
                        </span>
                      </div>
                    </div>

                    {/* Client stats and preferences */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-muted/40 border border-border/30 rounded-xl p-3.5 mb-4 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Location
                        </span>
                        <span className="text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />{" "}
                          {client.city}, India
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Annual Income
                        </span>
                        <span className="text-foreground font-medium">
                          ₹{client.incomeLPA} LPA
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Religion / Caste
                        </span>
                        <span className="text-foreground">
                          {client.religion} • {client.caste}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                          Marital Status
                        </span>
                        <span className="text-foreground">
                          {client.maritalStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3.5 mt-auto">
                    {/* Journey stage badge */}
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg ${getStageBadgeClass(client.journeyStage)}`}
                    >
                      {client.journeyStage}
                    </span>

                    {/* Notes count & View link */}
                    <div className="flex items-center gap-3">
                      {client.notesCount > 0 && (
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />{" "}
                          {client.notesCount}{" "}
                          {client.notesCount === 1 ? "note" : "notes"}
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-wider transition-colors hover:underline">
                        <span>Manage Client</span>
                        <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
