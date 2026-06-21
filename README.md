# Matchmaker

Matchmaker is a Next.js 16 internal dashboard for reviewing client profiles, ranking suggested matches, saving matchmaker notes, and generating AI-assisted introductions. It uses the App Router with React 19, TypeScript, Tailwind CSS, shadcn/Radix UI components, Bun scripts, NextAuth, and the OpenAI SDK. The project is organized so UI, seeded profile data, scoring logic, and API routes remain easy to inspect for a prototype or assignment review.

## Local Machine Setup

Clone the repository and move into the project folder:

```bash
git clone https://github.com/Ranjandas1/matchmaker
cd matchmaker
```

Install dependencies:

```bash
bun install
```

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following environment variables to `.env`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_USER_EMAIL=
NEXT_PUBLIC_USER_PASSWORD=
```

`OPENAI_API_KEY` is optional for local testing. If it is missing, the app still runs and uses a local rule-based fallback for AI intro generation.

Start the development server:

```bash
bun run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

For production-style local testing:

```bash
bun run build
bun run start
```

Useful commands:

```bash
bun run lint
bun run build
bun run start
```

## Folder Structure

```text
app/
  api/
    ai-intro/route.ts          OpenAI/local fallback intro generation
    auth/[...nextauth]/route.ts
    clients/[id]/notes/route.ts
    matches/[id]/route.ts      Match suggestions API
  clients/[id]/page.tsx        Client detail page
  dashboard/page.tsx           Dashboard page
  login/page.tsx               Login page
  layout.tsx                   Root layout
  page.tsx                     App entry page

components/
  client-details.tsx           Match review, notes, AI intro UI
  dashboard-client.tsx         Dashboard client component
  login-form.tsx               Login form
  ui/                          Shared UI components

data/
  profile.ts                   UserProfile TypeScript type
  profiles.ts                  Seed profile data
  notes.json                   Local notes storage

lib/
  auth.ts                      Auth configuration/helpers
  matchmaker.ts                Match scoring and ranking logic
  utils.ts                     Shared utilities

models/
  user.ts                      User model
```

## Matching Logic

The main matching logic is implemented in `lib/matchmaker.ts`. The matcher filters out inactive profiles, the current client profile, and non-opposite-gender candidates based on the current seed data. Each candidate receives a compatibility score out of 100, a category breakdown, a strict-match flag, and human-readable reasons that explain why the profile was suggested.

For male customers, the strict match rules prioritize women who are younger, earn less, are shorter, and have compatible views on children. For female customers, the scoring is more holistic and considers professional compatibility, education and career stability, values, family outlook, relocation feasibility, lifestyle habits, pets, children preferences, and shared interests. Matches are sorted with strict matches first, then by compatibility score from highest to lowest.

## AI Usage

AI is used in `app/api/ai-intro/route.ts`. When a matchmaker requests an AI review or opens the send-match email modal, the frontend sends the client profile, candidate profile, and match score to `/api/ai-intro`. If `OPENAI_API_KEY` is configured, OpenAI generates a short match fit analysis and a personalized intro email. The prompt includes the match score and gender-specific matching rules so the generated text follows the same logic used by the ranking engine.

The AI response is validated as JSON before it is returned to the UI. If the API call fails, or if no key is configured, the route falls back to a local rule-based generator. The route also prevents low or moderate matches from being described as "High Potential"; only scores of 85 or higher may use that label.

## Assumptions

Profiles are assumed to be pre-verified and available from local seed data. Gender and relationship preferences are simplified to match the fields in `UserProfile`. The score is designed to assist a human matchmaker, not automatically decide whether two people should connect. This is a prototype, so notes are stored locally in `data/notes.json` instead of a production database.
# matchmaker
