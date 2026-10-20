# Legal mapping — first implementation pass

Date of review: 2026-10-14. The official Minjust edition URLs supplied by the requester are the primary references. Secondary consolidated legal references are listed only to assist checking the relevant articles. Before production use, the court's responsible legal officer must validate the profile against the exact official edition and any Supreme Court regulations/orders in force.

## AПК КР — administrative proceedings

Primary source: https://cbd.minjust.gov.kg/3-28/edition/1265033/ru

Relevant provisions identified:

- Article 196: protocol is prepared for each court hearing and for each separate procedural action performed orally outside a hearing.
- Article 196-1: audio/video recording of the hearing is mandatory; before the hearing, the secretary checks recording equipment and attendance. If audio/video recording cannot be used, an act describing the reasons is prepared and attached to the case. The code describes exceptional situations where the court may decide not to record, with consent of the parties.
- Article 197: enumerates required content, including date/place and start/end time; court and composition; attendance and identities; explanation of rights; warnings where required; judicial directions and decisions; statements/motions and explanations; witness testimony; expert/specialist explanations; questions/answers; evidence playback/review; submissions and replies; prosecutor's conclusion; the court's departure to deliberate; announcement of court decisions; explanation of access/review rights; use of recording/video-conference/technical means; and date of preparation.
- Articles 170-1 to 170-3: administrative proceedings may be paper or digital. Article 170-3 provides that where the court uses a digital technological system for audio/video fixation, the recording is recognised as the protocol and a short written protocol is attached to the case; ASR text transcription may accompany it where technically possible.

Implementation consequence:

- Support a conventional written protocol plus mandatory AV recording.
- Support a separate `DIGITAL_AV_IS_PROTOCOL` mode only when the court has authorised and is actually using the relevant digital technological court system. That mode produces the required short written protocol and may add an ASR transcript.
- Include a pre-session recording check and a technical-failure report workflow.

## ГПК КР — civil proceedings

Primary source: https://cbd.minjust.gov.kg/3-29/edition/59858/ru

Relevant provisions identified:

- Article 229: protocol is prepared in each court hearing and for certain separate procedural actions outside the hearing.
- Article 229-1: AV recording of the hearing is mandatory, subject to the exceptions described in the code; the secretary checks equipment and attendance before the session, and prepares an act with reasons if recording cannot be used.
- Article 230: requires date/place, start/end time, court and composition, attendance and identities, explanation of procedural rights, required warnings, judicial directions/orders, motions and explanations, witness testimony, expert/specialist explanations, questions/answers, review of documentary/material/audio/video evidence, conclusions of state/local government bodies, judicial debates, deliberation, announcement/explanation of court acts and appeal process, explanation of rights to review the protocol and submit remarks, technical-recording details, and date of preparation/signing.
- Article 231: the written protocol is prepared by the secretary and accompanied by recording where used. It should be prepared and signed within three days after the hearing; in complex cases, the period can be extended but not beyond five days. The presiding judge and secretary sign. Corrections/additions must be described before signing and attested by both.
- Article 232: participants/their representatives may review the protocol and recording within five working days after preparation and signing, and may submit remarks within three working days after review. Erasures and white-out are prohibited.

Implementation consequence:

- Keep written protocol and AV recording as separate case materials.
- Provide deadline reminders based on the applicable version of the code.
- Prohibit destructive edits to a signed version; record corrections as a new version with a comparison/audit trail.

## УПК КР — criminal proceedings

Primary source: https://cbd.minjust.gov.kg/3-37/edition/59873/ru

Relevant provisions identified:

- Article 294: the secretary must fully and accurately reflect court actions/decisions and actions of participants; checks AV equipment and attendance before the hearing; a technical-failure act is prepared if AV recording cannot be used.
- Article 308: establishes protocol content, including hearing place/date and start/end time, court and participants, the case, procedural actions in sequence and other enumerated information; the protocol must be prepared and signed by the presiding judge and secretary no later than five days after the hearing. Article 309 separately regulates remarks on the written protocol.
- Article 309: contains the procedure for remarks on the hearing protocol and their consideration.
- Article 310: AV fixation is mandatory, with narrowly described exceptional cases where the court may decide otherwise with the relevant participants' consent; when AV fixation is used it is accompanied by a short written protocol. Read together with Article 308, the application model keeps the full written protocol and short protocol as distinct artifacts pending legal-unit confirmation of the exact document package for the selected workflow.
- Article 311: parties may review AV recording and the short protocol within five days after the short protocol is signed and submit remarks within three days after review; consideration follows Article 309.

Implementation consequence:

- Provide criminal-specific participant roles and event types (accused, defence, prosecutor, victim, witnesses, evidence, questioning, debates and last word) and the correct short-protocol/AV workflow.
- Do not assume the administrative code's digital-record-is-protocol rule applies to criminal proceedings.

## Legal-profile rules are not AI inference

The application can warn that a required field is missing, show a checklist and calculate configured deadlines. It must not decide that a no-show is legally excused, that a motion is granted/denied, that a court's act was pronounced, or that a protocol is legally valid based only on ASR. These are explicit actions/decisions entered or confirmed by the court staff.
