export class CreateCaseWorkflowDto {
  caseNumber: string;
  title: string;
  proceedingCode: 'APC' | 'GPK' | 'UPK';
  courtName: string;
  legalProfileId: string;
}

export class CreateHearingWorkflowDto {
  caseId: string;
  scheduledAt: string;
  recordingMode: 'WRITTEN_PROTOCOL_WITH_AV' | 'AV_WITH_SHORT_PROTOCOL' | 'DIGITAL_AV_IS_PROTOCOL';
  presidingJudgeName?: string;
  secretaryName?: string;
  location?: string;
}

export class CreateRecordingWorkflowDto {
  hearingId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

