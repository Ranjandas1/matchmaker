import { data } from "@/data/profiles";
import { UserProfile } from "@/data/profile";

export interface CompatibilityBreakdown {
  location: number;
  financial: number;
  lifestyle: number;
  values: number;
  physical: number;
}

export interface SuggestedMatch {
  profile: UserProfile;
  compatibilityScore: number;
  breakdown: CompatibilityBreakdown;
  strictMatch: boolean;
  matchReasons: string[];
}

function hasCompatibleChildrenView(client: UserProfile, candidate: UserProfile) {
  return (
    client.wantKids === candidate.wantKids ||
    client.wantKids === "Maybe" ||
    candidate.wantKids === "Maybe"
  );
}

function getCareerCluster(profile: UserProfile) {
  const text =
    `${profile.designation} ${profile.degree} ${profile.company}`.toLowerCase();

  if (
    /engineer|developer|devops|software|data|tech|product|it|wipro|infosys|tcs|byju/.test(
      text,
    )
  ) {
    return "technology";
  }
  if (/doctor|medical|md|pharm|health|hospital|clinical/.test(text)) {
    return "healthcare";
  }
  if (/finance|bank|analyst|account|investment|ca|mba|iim/.test(text)) {
    return "business";
  }
  if (/law|legal|advocate|attorney/.test(text)) {
    return "legal";
  }
  if (/teacher|professor|education|counsellor/.test(text)) {
    return "education";
  }
  if (/design|creative|marketing|media|content/.test(text)) {
    return "creative";
  }

  return "professional";
}

function areCareerClustersCompatible(client: UserProfile, candidate: UserProfile) {
  const clientCluster = getCareerCluster(client);
  const candidateCluster = getCareerCluster(candidate);

  if (clientCluster === candidateCluster) return true;

  const complementaryPairs = new Set([
    "technology-business",
    "business-technology",
    "healthcare-business",
    "business-healthcare",
    "creative-business",
    "business-creative",
    "legal-business",
    "business-legal",
  ]);

  return complementaryPairs.has(`${clientCluster}-${candidateCluster}`);
}

function hasAdvancedEducation(profile: UserProfile) {
  return /m\.|mba|md|phd|iim|iit|masters|master/i.test(
    `${profile.degree} ${profile.college}`,
  );
}

// Function to calculate matches for a specific client
export function getMatchesForClient(client: UserProfile): SuggestedMatch[] {
  // Use all profiles from seed data directly — no generation needed.
  // Pool candidates: opposite gender, not inactive, not the client themselves,
  // and type === "pool" (so we don't match clients against other clients).
  const candidates = data.filter((p) => {
    if (p.id === client.id) return false;
    if (p.status === "Inactive") return false;
    if (client.gender === "Male" && p.gender !== "Female") return false;
    if (client.gender === "Female" && p.gender !== "Male") return false;
    // Only match against pool profiles, not other clients
    // if (p.type !== "pool") return false;
    return true;
  });

  const matches: SuggestedMatch[] = candidates.map((candidate) => {
    // --- Gender-Specific Strict Rules ---
    let strictMatch = true;

    if (client.gender === "Male") {
      if (candidate.age >= client.age) strictMatch = false;
      if (candidate.incomeLPA >= client.incomeLPA) strictMatch = false;
      if (candidate.heightCm >= client.heightCm) strictMatch = false;
      if (!hasCompatibleChildrenView(client, candidate)) strictMatch = false;
    } else {
      if (!hasCompatibleChildrenView(client, candidate)) strictMatch = false;
      if (
        client.city !== candidate.city &&
        client.openToRelocate === "No" &&
        candidate.openToRelocate === "No"
      ) {
        strictMatch = false;
      }
      if (
        (client.familyValues === "Traditional" &&
          candidate.familyValues === "Liberal") ||
        (client.familyValues === "Liberal" &&
          candidate.familyValues === "Traditional")
      ) {
        strictMatch = false;
      }
    }

    // --- Compatibility Score Breakdown (out of 100) ---
    const femaleClient = client.gender === "Female";
    const locationMax = femaleClient ? 20 : 25;
    const financialMax = 20;
    const physicalMax = femaleClient ? 10 : 15;
    const valuesMax = femaleClient ? 25 : 20;
    const lifestyleMax = femaleClient ? 25 : 20;

    // Location
    let locationScore = 0;
    if (client.city === candidate.city) {
      locationScore = locationMax;
    } else if (
      client.openToRelocate === "Yes" ||
      candidate.openToRelocate === "Yes"
    ) {
      locationScore = femaleClient ? 15 : 18;
    } else if (
      client.openToRelocate === "Maybe" ||
      candidate.openToRelocate === "Maybe"
    ) {
      locationScore = femaleClient ? 10 : 12;
    }

    // Financial and professional compatibility
    let financialScore = 0;
    const incomeDiff = Math.abs(client.incomeLPA - candidate.incomeLPA);
    if (client.gender === "Male") {
      if (candidate.incomeLPA < client.incomeLPA) {
        const gap = client.incomeLPA - candidate.incomeLPA;
        financialScore = gap < 10 ? 20 : gap < 20 ? 16 : 12;
      } else {
        financialScore = 8;
      }
    } else {
      if (getCareerCluster(client) === getCareerCluster(candidate)) {
        financialScore += 9;
      } else if (areCareerClustersCompatible(client, candidate)) {
        financialScore += 7;
      } else {
        financialScore += 4;
      }

      if (hasAdvancedEducation(client) && hasAdvancedEducation(candidate)) {
        financialScore += 4;
      } else if (hasAdvancedEducation(candidate)) {
        financialScore += 2;
      }

      if (candidate.incomeLPA >= client.incomeLPA * 0.75) {
        financialScore += 5;
      } else if (incomeDiff < 8) {
        financialScore += 3;
      }

      if (candidate.incomeLPA >= 12) financialScore += 2;
      financialScore = Math.min(financialScore, financialMax);
    }

    // Physical — Age + Height
    const ageDiff = candidate.age - client.age;
    const heightDiff = candidate.heightCm - client.heightCm;
    let ageScore = 0;
    let heightScore = 0;

    if (client.gender === "Male") {
      ageScore =
        ageDiff < 0 && ageDiff >= -5
          ? 7.5
          : ageDiff < -5 && ageDiff >= -10
            ? 5.5
            : ageDiff === 0
              ? 4
              : 1;
      heightScore =
        heightDiff < 0 && heightDiff >= -15
          ? 7.5
          : heightDiff < -15
            ? 5.5
            : heightDiff === 0
              ? 4
              : 1;
    } else {
      ageScore = Math.abs(ageDiff) <= 4 ? 5 : Math.abs(ageDiff) <= 8 ? 3.5 : 1;
      heightScore =
        heightDiff >= 0 && heightDiff <= 15
          ? 5
          : Math.abs(heightDiff) <= 8
            ? 3
            : 1;
    }
    const physicalScore = ageScore + heightScore;

    // Values — Religion + Caste + Family Values + children for female clients
    let valuesScore = 0;
    if (femaleClient) {
      valuesScore += client.religion === candidate.religion ? 6 : 1;
      valuesScore +=
        client.caste === "Open/No Preference" ||
        candidate.caste === "Open/No Preference" ||
        client.caste === candidate.caste
          ? 3
          : 1;
      valuesScore +=
        client.familyValues === candidate.familyValues
          ? 8
          : client.familyValues === "Moderate" ||
              candidate.familyValues === "Moderate"
            ? 5
            : 1;
      valuesScore += hasCompatibleChildrenView(client, candidate) ? 5 : 0;
      valuesScore +=
        client.motherTongue === candidate.motherTongue ||
        client.languages.some((language) => candidate.languages.includes(language))
          ? 3
          : 1;
    } else {
      const religionPts = client.religion === candidate.religion ? 8 : 0;
      const castePts =
        client.caste === "Open/No Preference" ||
        candidate.caste === "Open/No Preference" ||
        client.caste === candidate.caste
          ? 6
          : 1;
      const familyValuesPts =
        client.familyValues === candidate.familyValues
          ? 6
          : client.familyValues === "Moderate" ||
              candidate.familyValues === "Moderate"
            ? 4
            : 1;
      valuesScore = religionPts + castePts + familyValuesPts;
    }

    // Lifestyle — Diet + Habits + Manglik + Kids + pets/interests
    let dietPts = 0;
    if (client.dietPreference === candidate.dietPreference) {
      dietPts = femaleClient ? 6 : 5;
    } else if (
      (client.dietPreference === "Vegetarian" &&
        candidate.dietPreference === "Jain Vegetarian") ||
      (client.dietPreference === "Jain Vegetarian" &&
        candidate.dietPreference === "Vegetarian")
    ) {
      dietPts = femaleClient ? 5 : 4;
    } else if (
      client.dietPreference === "Non-Vegetarian" ||
      candidate.dietPreference === "Non-Vegetarian"
    ) {
      dietPts = 2;
    } else {
      dietPts = 1;
    }

    let habitPts = 5;
    if (client.drinkingHabits !== candidate.drinkingHabits) habitPts -= 1.5;
    if (client.smokingHabits !== candidate.smokingHabits) habitPts -= 1.5;
    if (habitPts < 2) habitPts = 2;

    const manglikPts =
      client.manglik === "Doesn't Matter" ||
      candidate.manglik === "Doesn't Matter" ||
      client.manglik === candidate.manglik
        ? femaleClient
          ? 4
          : 5
        : 0;

    const kidsPts =
      femaleClient
        ? 0
        : client.wantKids === candidate.wantKids
        ? 5
        : client.wantKids === "Maybe" || candidate.wantKids === "Maybe"
          ? 3.5
          : 0;

    const petPts =
      femaleClient && client.openToPets === candidate.openToPets ? 3 : 0;

    const clientHobbies = client.hobbies
      .split(",")
      .map((h) => h.trim().toLowerCase());
    const candidateHobbies = candidate.hobbies
      .split(",")
      .map((h) => h.trim().toLowerCase());
    const sharedHobbies = clientHobbies.filter((h) =>
      candidateHobbies.includes(h),
    );
    const hobbyPts = femaleClient ? Math.min(sharedHobbies.length * 2.5, 5) : 0;

    const lifestyleScore = Math.min(
      dietPts + habitPts + manglikPts + kidsPts + petPts + hobbyPts,
      lifestyleMax,
    );

    const totalScore = Math.round(
      locationScore +
        financialScore +
        physicalScore +
        valuesScore +
        lifestyleScore,
    );

    // --- Match Reasons ---
    const matchReasons: string[] = [];

    if (client.city === candidate.city) {
      matchReasons.push(`Both reside in ${client.city}.`);
    } else if (
      client.openToRelocate === "Yes" ||
      candidate.openToRelocate === "Yes"
    ) {
      matchReasons.push("Open to relocation enables geographical match.");
    }

    if (client.religion === candidate.religion) {
      matchReasons.push(`Shared religious values (${client.religion}).`);
    }

    if (client.dietPreference === candidate.dietPreference) {
      matchReasons.push(
        `Compatible dietary choices (${client.dietPreference}).`,
      );
    }

    if (client.familyValues === candidate.familyValues) {
      matchReasons.push(`Aligned family mindset (${client.familyValues}).`);
    } else if (
      client.familyValues === "Moderate" ||
      candidate.familyValues === "Moderate"
    ) {
      matchReasons.push("Flexible and compatible family values.");
    }

    if (femaleClient) {
      if (getCareerCluster(client) === getCareerCluster(candidate)) {
        matchReasons.push(
          `Similar professional track in ${getCareerCluster(client)}.`,
        );
      } else if (areCareerClustersCompatible(client, candidate)) {
        matchReasons.push("Complementary professional backgrounds.");
      }

      if (candidate.incomeLPA >= client.incomeLPA * 0.75) {
        matchReasons.push("Comparable financial and career stability.");
      }

      if (client.openToPets === candidate.openToPets) {
        matchReasons.push("Aligned openness to pets.");
      }
    }

    if (sharedHobbies.length > 0) {
      matchReasons.push(
        `Overlapping interests in ${sharedHobbies.join(", ")}.`,
      );
    }

    if (client.wantKids === candidate.wantKids && client.wantKids === "Yes") {
      matchReasons.push(
        "Both are looking forward to having children in the future.",
      );
    }

    if (
      client.manglik === candidate.manglik &&
      client.manglik !== "Doesn't Matter"
    ) {
      matchReasons.push(`Compatible Manglik status (${client.manglik}).`);
    }

    return {
      profile: candidate,
      compatibilityScore: totalScore,
      breakdown: {
        location: Math.round((locationScore / locationMax) * 100),
        financial: Math.round((financialScore / financialMax) * 100),
        physical: Math.round((physicalScore / physicalMax) * 100),
        values: Math.round((valuesScore / valuesMax) * 100),
        lifestyle: Math.round((lifestyleScore / lifestyleMax) * 100),
      },
      strictMatch,
      matchReasons:
        matchReasons.length > 0
          ? matchReasons
          : ["Strong overall profile compatibility."],
    };
  });

  // Strict matches first, then sort by score descending
  return matches.sort((a, b) => {
    if (a.strictMatch && !b.strictMatch) return -1;
    if (!a.strictMatch && b.strictMatch) return 1;
    return b.compatibilityScore - a.compatibilityScore;
  });
}
