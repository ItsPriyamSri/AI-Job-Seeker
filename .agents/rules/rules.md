---
trigger: always_on
---

You are building "AI Job Seeker," a MERN-stack web app that recommends jobs to fresh
graduates using AI and lets them apply in one click.

AUTHORITATIVE DOCS — follow them exactly, don't invent alternatives:
- implementation-plan.md  → architecture, stack, data models, API contract, build phases
- design.md               → design system (colors, type, components, the Match Ring), screens
- SRS                     → functional requirements (FR-x.x) and scope

STACK (do not substitute without asking):
- Frontend: React 18 + TypeScript + Vite, Tailwind + shadcn/ui, Framer Motion,
  React Router, TanStack Query, Zustand, React Hook Form + Zod, Axios, Lucide.
- Backend: Node + Express + TypeScript, MongoDB + Mongoose, JWT + bcrypt, Zod,
  Multer, Cloudinary, pdf-parse, nodemailer.
- AI: Google Gemini via @google/genai (LLM + embeddings). All AI runs server-side only;
  never expose GEMINI_API_KEY to the client. Verify current Gemini model IDs and SDK
  calls against Google's docs before writing AI code; ask me if unsure.

NON-NEGOTIABLE RULES:
- The API contract in implementation-plan.md is the single source of truth shared by
  client and server. Keep request/response shapes identical on both sides. If you need
  to change it, update both sides and tell me.
- TypeScript strict mode on both sides. No `any` unless justified in a comment.
- Validate every API request body with Zod in middleware before the controller runs.
- Controllers stay thin; business logic lives in services. Components never call Axios
  directly — only through the feature hooks (useJobs, useRecommendations, etc.).
- Every screen ships loading (skeletons, not spinners), empty, and error states.
- Put all design tokens from design.md into tailwind.config.ts. Build the MatchRing
  component early; it is the signature element reused across the app.
- Wrap every Gemini call in try/catch with a graceful fallback. Cache embeddings and
  recommendation explanations. Rate-limit auth and AI routes.
- bcrypt for passwords, signed JWTs for auth, role-guard protected routes, CORS locked
  to CLIENT_URL, no secrets in client code.
- Enforce no-duplicate-applications with a DB unique index on Application(seekerId, jobId).

SCOPE GUARDRAILS:
- Apply is two-track: one-click apply for INTERNAL jobs; deep-link redirect for EXTERNAL
  jobs. Do NOT build automated submission to LinkedIn/Naukri/Indeed.
- Overleaf is outbound only: generate LaTeX and open it via the "Open in Overleaf" form
  POST. There is no inbound Overleaf API.
- OTP via email (nodemailer) for the demo; log the code to console in dev. SMS is a
  future upgrade, not now.

WORKING STYLE:
- Build strictly in the phase order from implementation-plan.md Section 10. Do ONE phase
  at a time. At the end of a phase, summarize what you built, how to run/test it, and stop
  for my confirmation before starting the next phase.
- Prefer small, reviewable changes. Explain any non-obvious decision in one line.
- If a requirement is ambiguous, ask one focused question instead of guessing.