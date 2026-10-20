# NestJS API implementation guide

Create modules in this order:

1. `auth` — local AD/LDAP/SSO integration only after the court's identity provider is confirmed; otherwise local auth with secure password hashing and MFA policy.
2. `cases` and `hearings` — CRUD, permissions and hearing status transitions.
3. `recordings` — safe upload, private storage, hashes, duration/format/size limits and technical failure reports.
4. `transcription` — authenticated service-to-service calls to the Python ASR service; background jobs and WebSocket events.
5. `protocols` — structured sections, document versions, required-field checklist driven by a pinned LegalProfile, DOCX export.
6. `audit` — append-only audit events and export/read access logs.

Do not expose the ASR service directly to the browser. Do not accept arbitrary filesystem paths from API clients.
