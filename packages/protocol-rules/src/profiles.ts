export type ProceedingCode = 'APC' | 'GPK' | 'UPK';

export type RecordingMode =
  | 'WRITTEN_PROTOCOL_WITH_AV'
  | 'AV_WITH_SHORT_PROTOCOL'
  | 'DIGITAL_AV_IS_PROTOCOL';

export type ProtocolArtifactKind = 'FULL_WRITTEN' | 'SHORT_WRITTEN' | 'ASR_TRANSCRIPT';

export interface DeadlineRule {
  id: string;
  trigger: string;
  amount: number;
  unit: 'HOURS' | 'CALENDAR_DAYS' | 'WORKING_DAYS';
  note: string;
  article: string;
}

export interface LegalProfile {
  code: ProceedingCode;
  titleRu: string;
  titleKy: string;
  sourceUrl: string;
  versionLabel: string;
  permittedRecordingModes: RecordingMode[];
  defaultRecordingMode: RecordingMode;
  requiredArtifactsByMode: Partial<Record<RecordingMode, ProtocolArtifactKind[]>>;
  optionalArtifactsByMode: Partial<Record<RecordingMode, ProtocolArtifactKind[]>>;
  audioVideoRecording: {
    normallyRequired: boolean;
    preSessionEquipmentCheck: boolean;
    technicalFailureActRequired: boolean;
    noRecordingRequiresCourtDecisionAndConsent: boolean;
  };
  requiredProtocolFields: string[];
  requiredHearingEvents: string[];
  signaturesRequired: string[];
  deadlines: DeadlineRule[];
  guards: string[];
}

export const legalProfiles: Record<ProceedingCode, LegalProfile> = {
  APC: {
    code: 'APC',
    titleRu: 'Административно-процессуальный кодекс Кыргызской Республики',
    titleKy: 'Кыргыз Республикасынын Административдик-процесстик кодекси',
    sourceUrl: 'https://cbd.minjust.gov.kg/3-28/edition/1265033/ru',
    versionLabel: 'Проверка профиля: 2026-10-14; сверить с указанной официальной редакцией перед вводом в эксплуатацию',
    permittedRecordingModes: [
      'WRITTEN_PROTOCOL_WITH_AV',
      'DIGITAL_AV_IS_PROTOCOL',
    ],
    defaultRecordingMode: 'WRITTEN_PROTOCOL_WITH_AV',
    requiredArtifactsByMode: {
      WRITTEN_PROTOCOL_WITH_AV: ['FULL_WRITTEN'],
      DIGITAL_AV_IS_PROTOCOL: ['SHORT_WRITTEN'],
    },
    optionalArtifactsByMode: {
      WRITTEN_PROTOCOL_WITH_AV: ['ASR_TRANSCRIPT'],
      DIGITAL_AV_IS_PROTOCOL: ['ASR_TRANSCRIPT'],
    },
    audioVideoRecording: {
      normallyRequired: true,
      preSessionEquipmentCheck: true,
      technicalFailureActRequired: true,
      noRecordingRequiresCourtDecisionAndConsent: true,
    },
    requiredProtocolFields: [
      'hearingDateAndPlace',
      'startAndEndTime',
      'courtNameAndComposition',
      'secretary',
      'caseTitleAndParties',
      'attendanceAndIdentities',
      'rightsExplained',
      'requiredWarnings',
      'presidingDirectionsAndNonSeparateRulings',
      'motionsAndPartyExplanations',
      'witnessTestimonyAndExpertSpecialistExplanations',
      'questionsAndAnswers',
      'reviewOfEvidence',
      'judicialDebatesAndReplies',
      'prosecutorConclusionWhenApplicable',
      'departureForDeliberation',
      'announcementOfJudicialActs',
      'reviewAndRemarksRightsExplained',
      'technicalRecordingAndVideoconferenceInfo',
      'protocolPreparationDate',
    ],
    requiredHearingEvents: [
      'SESSION_OPENED', 'CASE_ANNOUNCED', 'ATTENDANCE_REPORTED',
      'IDENTITIES_ESTABLISHED', 'COURT_COMPOSITION_ANNOUNCED',
      'CHALLENGE_RIGHTS_EXPLAINED', 'PROCEDURAL_RIGHTS_EXPLAINED',
      'MOTIONS_RESOLVED', 'PARTIES_HEARD', 'EVIDENCE_REVIEWED',
      'MERITS_CLOSED', 'DEBATES', 'REPLIES', 'COURT_DELIBERATION',
      'JUDICIAL_ACT_ANNOUNCED', 'APPEAL_PROCEDURE_EXPLAINED', 'SESSION_CLOSED',
    ],
    signaturesRequired: ['PRESIDING_JUDGE', 'SECRETARY'],
    deadlines: [],
    guards: [
      'DIGITAL_AV_IS_PROTOCOL is permitted only if the court uses the applicable authorised digital technological court system under APC Articles 170-1 to 170-3 and related Supreme Court rules.',
      'When AV recording cannot be used, prompt the secretary to record the technical reason and attach the required act.',
      'If DIGITAL_AV_IS_PROTOCOL is selected, generate the short written protocol; include ASR transcript only as an auxiliary transcript when technically supported.',
    ],
  },
  GPK: {
    code: 'GPK',
    titleRu: 'Гражданский процессуальный кодекс Кыргызской Республики',
    titleKy: 'Кыргыз Республикасынын Жарандык процесстик кодекси',
    sourceUrl: 'https://cbd.minjust.gov.kg/3-29/edition/59858/ru',
    versionLabel: 'Проверка профиля: 2026-10-14; сверить с указанной официальной редакцией перед вводом в эксплуатацию',
    permittedRecordingModes: ['WRITTEN_PROTOCOL_WITH_AV'],
    defaultRecordingMode: 'WRITTEN_PROTOCOL_WITH_AV',
    requiredArtifactsByMode: { WRITTEN_PROTOCOL_WITH_AV: ['FULL_WRITTEN'] },
    optionalArtifactsByMode: { WRITTEN_PROTOCOL_WITH_AV: ['ASR_TRANSCRIPT'] },
    audioVideoRecording: {
      normallyRequired: true,
      preSessionEquipmentCheck: true,
      technicalFailureActRequired: true,
      noRecordingRequiresCourtDecisionAndConsent: true,
    },
    requiredProtocolFields: [
      'hearingDateAndPlace', 'startAndEndTime', 'courtNameAndComposition',
      'secretary', 'caseTitle', 'attendanceAndIdentities', 'rightsExplained',
      'requiredWarnings', 'presidingDirectionsAndNonSeparateRulings',
      'motionsAndPartyExplanations', 'witnessTestimonyAndExpertSpecialistExplanations',
      'questionsAndAnswers', 'reviewOfEvidence', 'stateAndLocalGovernmentConclusions',
      'judicialDebates', 'departureForDeliberation', 'announcementAndExplanationOfJudicialActs',
      'reviewAndRemarksRightsExplained', 'technicalRecordingAndVideoconferenceInfo',
      'protocolPreparationAndSigningDate',
    ],
    requiredHearingEvents: [
      'SESSION_OPENED', 'CASE_ANNOUNCED', 'ATTENDANCE_REPORTED',
      'IDENTITIES_ESTABLISHED', 'COURT_COMPOSITION_ANNOUNCED',
      'PROCEDURAL_RIGHTS_EXPLAINED', 'MOTIONS_RESOLVED', 'PARTIES_HEARD',
      'EVIDENCE_REVIEWED', 'MERITS_CLOSED', 'DEBATES', 'REPLIES',
      'COURT_DELIBERATION', 'JUDICIAL_ACT_ANNOUNCED', 'SESSION_CLOSED',
    ],
    signaturesRequired: ['PRESIDING_JUDGE', 'SECRETARY'],
    deadlines: [
      {
        id: 'GPK_PROTOCOL_PREPARATION',
        trigger: 'HEARING_ENDED',
        amount: 3,
        unit: 'CALENDAR_DAYS',
        note: 'Protocol must be prepared and signed within three days; complex cases may use an extended period, not later than five days. Treat this as a reminder, not as an automated legal determination.',
        article: 'Article 231, parts 5-6',
      },
      {
        id: 'GPK_REVIEW',
        trigger: 'PROTOCOL_SIGNED',
        amount: 5,
        unit: 'WORKING_DAYS',
        note: 'Window for participants/representatives to review protocol and recording, according to Article 232.',
        article: 'Article 232, part 1',
      },
      {
        id: 'GPK_REMARKS',
        trigger: 'PROTOCOL_REVIEWED',
        amount: 3,
        unit: 'WORKING_DAYS',
        note: 'Window for submitting remarks after review. Count according to applicable procedural time-computation rules.',
        article: 'Article 232, part 1',
      },
    ],
    guards: [
      'No destructive editing of a signed version; record corrections as a versioned amendment and require the legally required attestations.',
      'Do not allow silent erasures or white-out in the exported document.',
    ],
  },
  UPK: {
    code: 'UPK',
    titleRu: 'Уголовно-процессуальный кодекс Кыргызской Республики',
    titleKy: 'Кыргыз Республикасынын Кылмыш-жаза процессуалдык кодекси',
    sourceUrl: 'https://cbd.minjust.gov.kg/3-37/edition/59873/ru',
    versionLabel: 'Проверка профиля: 2026-10-14; сверить с указанной официальной редакцией перед вводом в эксплуатацию',
    permittedRecordingModes: ['AV_WITH_SHORT_PROTOCOL'],
    defaultRecordingMode: 'AV_WITH_SHORT_PROTOCOL',
    requiredArtifactsByMode: {
      // Articles 308 and 310 address the written protocol content/deadline and short protocol accompanying AV fixation.
      // Confirm the exact document package with the court's legal unit before production deployment.
      AV_WITH_SHORT_PROTOCOL: ['FULL_WRITTEN', 'SHORT_WRITTEN'],
    },
    optionalArtifactsByMode: { AV_WITH_SHORT_PROTOCOL: ['ASR_TRANSCRIPT'] },
    audioVideoRecording: {
      normallyRequired: true,
      preSessionEquipmentCheck: true,
      technicalFailureActRequired: true,
      noRecordingRequiresCourtDecisionAndConsent: true,
    },
    requiredProtocolFields: [
      'hearingDateAndPlace', 'startAndEndTime', 'courtNameAndComposition',
      'secretaryAndRequiredParticipants', 'caseTitle', 'proceduralActionsInSequence',
      'identityOfAccused', 'motionsAndObjections', 'courtRulingsAndOrders',
      'testimonyAndQuestionsAnswers', 'evidenceExamination', 'debatesAndLastWordWhenApplicable',
      'announcementOfJudicialActAndAppealProcedure', 'avRecordingInformation',
    ],
    requiredHearingEvents: [
      'SESSION_OPENED', 'CASE_ANNOUNCED', 'ATTENDANCE_REPORTED',
      'IDENTITIES_ESTABLISHED', 'COURT_COMPOSITION_ANNOUNCED',
      'RIGHTS_EXPLAINED', 'MOTIONS_RESOLVED', 'CHARGES_AND_POSITIONS_RECORDED',
      'QUESTIONING', 'EVIDENCE_REVIEWED', 'DEBATES', 'LAST_WORD_WHEN_APPLICABLE',
      'COURT_DELIBERATION', 'JUDICIAL_ACT_ANNOUNCED', 'SESSION_CLOSED',
    ],
    signaturesRequired: ['PRESIDING_JUDGE', 'SECRETARY'],
    deadlines: [
      {
        id: 'UPK_PROTOCOL_PREPARATION',
        trigger: 'HEARING_ENDED',
        amount: 5,
        unit: 'CALENDAR_DAYS',
        note: 'Article 308 specifies preparation and signing of the protocol within five days after the hearing.',
        article: 'Article 308, part 5',
      },
      {
        id: 'UPK_SHORT_PROTOCOL_REVIEW',
        trigger: 'SHORT_PROTOCOL_SIGNED',
        amount: 5,
        unit: 'CALENDAR_DAYS',
        note: 'Window to review the AV recording and short protocol after the short protocol is signed.',
        article: 'Article 311, part 1',
      },
      {
        id: 'UPK_PROTOCOL_REMARKS',
        trigger: 'PROTOCOL_REVIEWED',
        amount: 5,
        unit: 'CALENDAR_DAYS',
        note: 'Remarks on the hearing protocol may be submitted within five days after reviewing it; Article 309. Calculate according to applicable procedural time-computation rules.',
        article: 'Article 309, part 1',
      },
      {
        id: 'UPK_AV_REMARKS',
        trigger: 'AV_AND_SHORT_PROTOCOL_REVIEWED',
        amount: 3,
        unit: 'CALENDAR_DAYS',
        note: 'Window to submit remarks after review; calculation must follow applicable time-computation rules.',
        article: 'Article 311, part 1',
      },
    ],
    guards: [
      'Keep AV recording and the short written protocol linked as case materials.',
      'The code provides specific exceptional cases for not recording; never make the exception automatic in software.',
      'Do not reuse APC Article 170-3 digital-record-as-protocol logic for criminal proceedings.',
    ],
  },
};
