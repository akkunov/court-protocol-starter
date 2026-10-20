# Court Protocol — legal-first starter

Starter scaffold for an on-premises application to prepare court hearing protocols in Kyrgyz and Russian, with local audio capture, ASR, a structured editor and DOCX export.

## Design decision

Use a universal technical core with separately versioned legal profiles:

- APC — Administrative Procedure Code (АПК КР)
- GPK — Civil Procedure Code (ГПК КР)
- UPK — Criminal Procedure Code (УПК КР)

The initial implementation should target administrative proceedings first, because the supplied sample is from an administrative court. GPK and UPK profiles can share the editor, audio pipeline and storage but must have separate required fields, hearing-event flows, recording modes, deadlines and DOCX templates.

> Legal caution: this scaffold is a software design baseline, not an official court digital system and not a legal opinion. In particular, under APC article 170-3, an audio/video recording is treated as the protocol when the court uses a digital technological system of audio/video fixation. A standalone locally deployed app must not claim that status unless its use is authorised under the applicable Supreme Court rules and digital-court framework.

## Current contents

- docs/LEGAL_MAPPING.md — first-pass mapping to relevant provisions in the supplied codes.
- packages/protocol-rules/src/profiles.ts — typed profiles for APC, GPK and UPK, with conditions and source links.
- prisma/schema.prisma — universal relational model for cases, hearings, participants, audio source types, queued transcription jobs, transcript segments, chronological hearing events, protocol versions and audit. Uses the Prisma ORM v7 generator/config pattern.
- services/asr/app/main.py — offline-only ASR service starter using `faster-whisper` for uploaded local files (not yet a real-time streaming implementation).
- docs/EXISTING_RECORDING_WORKFLOW.md — workflow for importing recordings from a phone recorder/dictaphone, upload validation, background transcription jobs, mobile-browser constraints and proposed API endpoints.
- prisma.config.ts — Prisma ORM v7 CLI configuration.
- apps/api/src/prisma.service.example.ts — NestJS Prisma 7 + PostgreSQL driver-adapter example.
- `.env.example` — local environment variables.
- `docker-compose.yml` — PostgreSQL only; app services are intentionally not presented as production-ready until their implementations and security checks exist.

## Development principles

1. Preserve original audio and ASR output separately from the edited protocol.
2. Preserve uploaded original recordings unchanged. Transcoded audio, if needed, is a separate derived artifact.
3. Never let AI silently rewrite testimony, questions/answers, judicial directions or legal conclusions. AI may suggest formatting; a user must confirm edits.
4. Keep audio and documents out of public web directories. All storage keys are private identifiers, not public URLs.
5. The final document is immutable. Corrections create a new version and an audit entry; never silently overwrite the signed version.
6. Store the legal-profile ID and exact profile/template snapshot on each protocol version, so a later law/template update does not retroactively change a past document.
7. Run ASR and dependency installation offline after preloading approved models and packages. Block outbound network access for the ASR service in deployment.
8. Validate requirements against the official text and applicable Supreme Court rules before legal use.

## Local run

1. Create environment file:
   cp .env.example .env
2. Start database and services:
   docker compose up -d
3. Generate Prisma client:
   npm run db:generate
4. Run migrations:
   npm run db:migrate
5. Seed demo data:
   npm run db:seed
6. Start API:
   npm run dev:api

## API quick test

- POST /cases
- POST /hearings
- POST /recordings/upload
- POST /workflow/case
- POST /workflow/hearing
- POST /workflow/recording
- POST /workflow/transcription/:recordingId
- POST /workflow/protocol/export/:protocolId

## Important

This repository is a strong technical backbone, but not a court-certified production system. Any real legal deployment needs legal review, court-approved configuration, and compliance validation.


## Corrections in branch `fix/workflow-and-storage`

This branch contains a first repair pass for local development:

- API and ASR API-key guards fail closed when keys are missing or still placeholders.
- Audio uploads validate required fields, file size, extension and MIME type, calculate SHA-256, and use private storage.
- The web UI uses a real selected audio file, checks failed HTTP responses, requires an actual hearing ID, and uses configurable local API settings.
- The ASR endpoint now finds the recording by its storage key, records a transcription job, saves recognized segments to PostgreSQL, and updates job/recording status.
- DOCX export writes to `COURT_STORAGE_ROOT/exports`, exports the stored protocol content, returns a downloadable DOCX, and does not mark a draft FINAL merely because it was exported.
- The seed includes a demo protocol template and draft for checking DOCX export.
- The API Docker image generates the Prisma client during build, and Docker Compose uses the database service hostname from inside the container.

### Local configuration notes

1. Copy root `.env.example` to `.env` and replace every `replace-with-...` value with a different long random secret.
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and set `VITE_API_KEY` equal to the root `API_KEY` **for localhost testing only**. Vite embeds `VITE_*` values in browser JavaScript; do not use this shared-key setup for a deployed court system.
3. Place the pre-downloaded faster-whisper/CTranslate2 model files at the configured `ASR_MODEL_PATH` inside the ASR container. The repository does not contain model weights and the service uses `local_files_only=True`.
4. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, then `docker compose up --build` if you use Docker. For a fully Docker-based setup, ensure the `.env` file has the correct local secrets before building.
5. Run `npm run build` and review all output before using the branch.

### Remaining before real court use

This is not production-ready authentication: the starter still uses a shared API key, not per-user login/roles. ASR is called synchronously by the API rather than by a durable background worker, and the protocol editor, version history, legal completeness checks, signing, and audit policy need implementation and testing. Do not process real case audio or personal data until those are complete and reviewed.
