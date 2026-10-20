# Existing dictaphone recording workflow

The application supports three distinct audio sources while using one transcription and review pipeline:

- `MOBILE_LIVE`: audio captured live from the phone browser/PWA.
- `DICTAPHONE_UPLOAD`: an existing recording imported from a phone's voice-recorder app or a dedicated dictaphone.
- `DESKTOP_UPLOAD`: an audio file selected on a workstation.
- `DICTATION`: a short, deliberate voice note intended for a specific protocol section.

## User journey

1. The secretary opens a case and hearing, or creates them first.
2. On the hearing page, they choose **Upload existing recording**.
3. The file picker can open device storage on Android/iOS; on iOS, the recording may need to be shared/exported from Voice Memos to Files first, depending on the browser and OS version.
4. The server validates authentication, hearing-level access, file size, extension, actual media signature and duration. Client-provided MIME type is not trusted.
5. The original file is written to a private storage directory using a random server-generated key. It is never stored under `public/` and the original filename is metadata only.
6. The server computes SHA-256 and creates `AudioRecording` with source `DICTAPHONE_UPLOAD` or `DESKTOP_UPLOAD`.
7. A `TranscriptionJob` is queued. The API returns the job ID immediately rather than holding an HTTP request open for a long transcription.
8. A local ASR worker reads the private storage key, transcribes in `ky` or `ru` mode, and writes timestamped `TranscriptSegment` rows. For long files, progress and failures are visible to the secretary.
9. The browser polls a job endpoint or receives status events over WebSocket. The secretary can open a segment at its timestamp, listen to the corresponding audio, correct text and assign a known hearing participant to a speaker key.
10. The secretary reviews the transcript and uses it as source material to compose a protocol. The system must not silently transform testimony into a legal conclusion or treat raw ASR output as a final official protocol.

## Formats and operational requirements

- Candidate formats: WAV, MP3, M4A/AAC, MP4 audio, WebM and Ogg, subject to the installed FFmpeg build and tests. The server must validate actual content, not just the filename.
- Keep an explicit configurable maximum upload size and maximum duration. Do not accept unlimited files.
- For mobile uploads, show upload progress, retry safely and use resumable/chunked upload for large files. A repeated request must not create duplicate transcription jobs; use an idempotency key.
- Do not transcode or modify the preserved original. If normalization/transcoding is needed for ASR, write a separate derived file and retain its provenance.
- Record job states (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`) and safe error codes. Do not expose filesystem paths or stack traces to clients.
- Validate available disk capacity before upload, quarantine invalid media, and clean up abandoned temporary chunks according to a documented retention policy.
- The ASR worker runs locally, with model files preloaded and outbound network access blocked in production. The API and worker authenticate to each other over the private network.
- Audio retention, deletion, access permissions and audit logging must follow the court's approved policy. Do not delete the source audio automatically just because a DOCX was exported.

## Mobile-browser limitation

A PWA can upload an existing recording through the device's file picker, but mobile operating systems differ in which recorder apps expose files to the browser. If a recording is not visible in the picker, the user can export/share it to Files first. A native Android app is only necessary if the court requires reliable background recording with the screen locked; uploading an existing file does not require a native app.

## API contract proposal

- `POST /hearings/:hearingId/recordings` — multipart upload; returns recording metadata and a queued transcription job.
- `GET /recordings/:recordingId` — metadata and processing status.
- `GET /transcription-jobs/:jobId` — queue state and progress percentage.
- `POST /recordings/:recordingId/transcription-jobs` — start/retry transcription with a validated language and idempotency key.
- `GET /hearings/:hearingId/segments?recordingId=...` — timestamped transcript segments.
- `PATCH /segments/:segmentId` — edit recognized text, with optimistic revision checks and audit trail.

These endpoints are a contract proposal; they must be implemented behind authentication, authorization and rate/size limits before use.
