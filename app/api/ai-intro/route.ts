import type { UserProfile } from "@/data/profile";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY || "";

interface AiIntroResponse {
  fitAnalysis: string;
  emailIntro: string;
}

interface AiIntroRequestBody {
  client?: UserProfile;
  candidate?: UserProfile;
  matchScore?: number;
}

function getMatchTone(matchScore?: number) {
  if (typeof matchScore !== "number") {
    return {
      label: "Potential Match",
      strength: "potential",
      fitOpening: "Potential Match",
      emailSubject: "Match Proposal",
      emailDescription: "a profile that may be worth exploring",
      promptGuidance:
        "The match score is unavailable, so keep the tone balanced and do not call it a high-potential or exceptionally strong match.",
    };
  }

  if (matchScore >= 85) {
    return {
      label: "High Potential Match",
      strength: "strong",
      fitOpening: "High Potential Match",
      emailSubject: "High Potential Match Proposal",
      emailDescription: "a profile that stood out as a strong match",
      promptGuidance:
        "The match score is high, so it is acceptable to describe this as a strong or high-potential match.",
    };
  }

  if (matchScore >= 70) {
    return {
      label: "Moderate Match",
      strength: "moderate",
      fitOpening: "Moderate Match",
      emailSubject: "Match Proposal",
      emailDescription: "a profile with some promising areas of compatibility",
      promptGuidance:
        "The match score is moderate, so use measured language. Do not call it a high-potential or exceptionally strong match.",
    };
  }

  return {
    label: "Potential Match",
    strength: "exploratory",
    fitOpening: "Potential Match",
    emailSubject: "Match Proposal",
    emailDescription: "a profile with a few compatibility points to consider",
    promptGuidance:
      "The match score is low. Use cautious, exploratory language and clearly avoid phrases like high-potential, highly compatible, excellent match, or exceptionally strong.",
  };
}

function isAiIntroResponse(value: unknown): value is AiIntroResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.fitAnalysis === "string" &&
    typeof response.emailIntro === "string"
  );
}

function removeOverstatedLanguage(
  response: AiIntroResponse,
  matchScore?: number,
): AiIntroResponse {
  if (typeof matchScore === "number" && matchScore >= 85) {
    return response;
  }

  const replaceOverstatements = (text: string) =>
    text
      .replace(/\bhigh[- ]potential match\b/gi, "potential match")
      .replace(/\bhigh[- ]potential\b/gi, "potential")
      .replace(/\bexceptionally strong\b/gi, "worth reviewing")
      .replace(/\bexcellent match\b/gi, "possible match")
      .replace(/\bhighly compatible\b/gi, "potentially compatible");

  return {
    fitAnalysis: replaceOverstatements(response.fitAnalysis),
    emailIntro: replaceOverstatements(response.emailIntro),
  };
}

function generateLocalFallback(
  client: UserProfile,
  candidate: UserProfile,
  matchScore?: number,
) {
  const tone = getMatchTone(matchScore);
  // Clean hobbies
  const clientHobbies = client.hobbies || "";
  const candidateHobbies = candidate.hobbies || "";

  // Construct fit analysis
  const matchingPoints = [];
  if (client.gender === "Male") {
    if (candidate.age < client.age) {
      matchingPoints.push(`${candidate.firstName} is younger than ${client.firstName}`);
    }
    if (candidate.incomeLPA < client.incomeLPA) {
      matchingPoints.push("the income expectation fits the client preference");
    }
    if (candidate.heightCm < client.heightCm) {
      matchingPoints.push("the height preference is aligned");
    }
    if (
      client.wantKids === candidate.wantKids ||
      client.wantKids === "Maybe" ||
      candidate.wantKids === "Maybe"
    ) {
      matchingPoints.push("their views on children are compatible");
    }
  }

  if (client.city === candidate.city) {
    matchingPoints.push(
      `both reside in ${client.city}, making meetups convenient`,
    );
  } else {
    if (client.openToRelocate === "Yes" || client.openToRelocate === "Maybe") {
      matchingPoints.push(`${client.firstName} is open to relocating`);
    }
    if (
      candidate.openToRelocate === "Yes" ||
      candidate.openToRelocate === "Maybe"
    ) {
      matchingPoints.push(`${candidate.firstName} is open to relocating`);
    }
  }

  if (client.gender === "Female") {
    matchingPoints.push(
      `their professional profiles can be reviewed together: ${client.firstName} is a ${client.designation}, while ${candidate.firstName} is a ${candidate.designation}`,
    );
  }

  if (client.religion === candidate.religion) {
    matchingPoints.push(
      `they share the same religious background (${client.religion})`,
    );
  }

  if (client.familyValues === candidate.familyValues) {
    matchingPoints.push(
      `both align on a ${client.familyValues.toLowerCase()} family values mindset`,
    );
  }

  if (client.dietPreference === candidate.dietPreference) {
    matchingPoints.push(
      `both prefer a ${client.dietPreference.toLowerCase()} diet`,
    );
  }

  // Intersect hobbies
  const clientHobList = clientHobbies
    .split(",")
    .map((h: string) => h.trim().toLowerCase());
  const candHobList = candidateHobbies
    .split(",")
    .map((h: string) => h.trim().toLowerCase());
  const shared = clientHobList.filter((h: string) => candHobList.includes(h));

  if (shared.length > 0) {
    matchingPoints.push(`they both enjoy ${shared.join(" & ")}`);
  } else {
    matchingPoints.push(
      `they have diverse interests ranging from ${clientHobList[0] || "fitness"} to ${candHobList[0] || "reading"}`,
    );
  }

  const joinStr =
    matchingPoints.length > 1
      ? matchingPoints.slice(0, -1).join(", ") +
        " and " +
        matchingPoints.slice(-1)
      : matchingPoints[0] || "they share general compatibility";

  const scoreContext =
    typeof matchScore === "number" ? ` With a ${matchScore}% score,` : "";
  const fitAnalysis = `${tone.fitOpening}!${scoreContext} this looks like a ${tone.strength} match because ${joinStr}. Professionally, ${client.firstName} is a ${client.designation} at ${client.company} and ${candidate.firstName} works as a ${candidate.designation} at ${candidate.company}, giving the matchmaker useful context to review before suggesting a connection.`;

  const emailIntro = `Subject: ${tone.emailSubject}: Meet ${candidate.firstName}

    Hi ${client.firstName},

    I hope you're doing well! I've been reviewing profiles in our verified pool and found ${tone.emailDescription} for you.

    Meet ${candidate.firstName} (${candidate.age}, living in ${candidate.city}). She is a ${candidate.designation} at ${candidate.company} and has completed her ${candidate.degree} from ${candidate.college}. 

    Why this may be worth considering:
    - You both are based in or open to ${client.city === candidate.city ? client.city : "relocation"}.
    - Aligned preferences: ${client.firstName} (${client.religion}) and ${candidate.firstName} (${candidate.religion}) both value ${candidate.familyValues.toLowerCase()} traditions.
    - Shared lifestyle: You both are ${client.dietPreference.toLowerCase()} and enjoy activities like ${candidate.hobbies.toLowerCase()}.

    Let me know if you would like me to share your profile with ${candidate.firstName} and coordinate an introductory call!

    Best regards,
    Your TDC Matchmaker`;

  return { fitAnalysis, emailIntro };
}

export async function POST(req: NextRequest) {
  try {
    const { client, candidate, matchScore } =
      (await req.json()) as AiIntroRequestBody;
    const tone = getMatchTone(matchScore);

    if (!client || !candidate) {
      return NextResponse.json(
        { error: "Missing client or candidate profile" },
        { status: 400 },
      );
    }

    if (!apiKey) {
      console.log(
        "OpenAI API key missing. Using local rule-based heuristic generation.",
      );
      const fallback = generateLocalFallback(client, candidate, matchScore);
      return NextResponse.json(fallback);
    }

    try {
      const openai = new OpenAI({ apiKey });

      // OpenAI Call
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert matchmaking assistant at The Date Crew (TDC), a premium dating and matrimonial service in India. You help matchmakers write compelling profile reviews and intro emails.",
          },
          {
            role: "user",
            content: `Generate a match fit analysis and a personalized intro email for:
                    Client: ${JSON.stringify(client)}
                    Candidate (Match): ${JSON.stringify(candidate)}
                    Match score: ${typeof matchScore === "number" ? `${matchScore}% (${tone.label})` : "Unavailable"}

                    Provide your response in JSON format containing two keys:
                    1. "fitAnalysis": A short paragraph (2-3 sentences) analyzing the compatibility level in the Indian matchmaking space, highlighting specific fields like profession, location, values, or diet.
                    2. "emailIntro": A warm, professional email from the matchmaker to the Client introducing them to the Candidate, explaining the key compatibility factors, and asking if they want to connect.

                    Matching rules to reflect:
                    - For male clients, prioritize whether the candidate is younger, earns less, is shorter, and has compatible views on children.
                    - For female clients, use more thoughtful reasoning around professional compatibility, shared values, relocation feasibility, lifestyle fit, and views on children.

                    Tone guidance: ${tone.promptGuidance}

                    Return ONLY a valid JSON object. Do not include markdown code block formatting.`,
          },
        ],
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content || "";
      // Strip markdown code block wrappers if any
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (!isAiIntroResponse(parsed)) {
        throw new Error("OpenAI returned an invalid AI intro payload");
      }

      return NextResponse.json({
        ...removeOverstatedLanguage(parsed, matchScore),
      });
    } catch (apiError) {
      console.error(
        "OpenAI API call failed, falling back to local heuristics:",
        apiError,
      );
      const fallback = generateLocalFallback(client, candidate, matchScore);
      return NextResponse.json(fallback);
    }
  } catch (error: unknown) {
    console.error("Error in AI intro generation endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
