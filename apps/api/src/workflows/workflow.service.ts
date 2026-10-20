import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Packer, Paragraph, Document, HeadingLevel } from 'docx';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async createCaseWorkflow(data: {
    caseNumber: string;
    title: string;
    proceedingCode: 'APC' | 'GPK' | 'UPK';
    courtName: string;
    legalProfileId: string;
  }) {
    const legalProfile = await this.prisma.legalProfile.findUnique({
      where: { id: data.legalProfileId },
    });

    if (!legalProfile) {
      throw new NotFoundException('Legal profile not found');
    }

    const courtCase = await this.prisma.courtCase.create({
      data: {
        caseNumber: data.caseNumber,
        title: data.title,
        proceedingCode: data.proceedingCode,
        courtName: data.courtName,
        legalProfileId: data.legalProfileId,
        status: 'OPEN',
      },
    });

    return {
      caseId: courtCase.id,
      proceedingCode: courtCase.proceedingCode,
      legalProfile: legalProfile.code,
      status: courtCase.status,
      nextStep: 'Create hearing for this case',
    };
  }

  async createHearingWorkflow(data: {
    caseId: string;
    scheduledAt: string;
    recordingMode: 'WRITTEN_PROTOCOL_WITH_AV' | 'AV_WITH_SHORT_PROTOCOL' | 'DIGITAL_AV_IS_PROTOCOL';
    presidingJudgeName?: string;
    secretaryName?: string;
    location?: string;
  }) {
    const courtCase = await this.prisma.courtCase.findUnique({ where: { id: data.caseId } });
    if (!courtCase) {
      throw new NotFoundException('Case not found');
    }

    const hearing = await this.prisma.hearing.create({
      data: {
        caseId: data.caseId,
        instance: 'FIRST_INSTANCE',
        status: 'PLANNED',
        recordingMode: data.recordingMode,
        scheduledAt: new Date(data.scheduledAt),
        timezone: 'Asia/Bishkek',
        presidingJudgeName: data.presidingJudgeName,
        secretaryName: data.secretaryName,
        location: data.location,
        ruleSnapshot: {
          proceedingCode: courtCase.proceedingCode,
          recordingMode: data.recordingMode,
          validated: true,
        },
      },
    });

    return {
      hearingId: hearing.id,
      caseId: hearing.caseId,
      status: hearing.status,
      nextStep: 'Upload recording and trigger ASR',
    };
  }

  async createRecordingWorkflow(data: {
    hearingId: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  }) {
    const hearing = await this.prisma.hearing.findUnique({ where: { id: data.hearingId } });
    if (!hearing) {
      throw new NotFoundException('Hearing not found');
    }

    const recording = await this.prisma.audioRecording.create({
      data: {
        hearingId: data.hearingId,
        storageKey: data.storageKey,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: BigInt(data.sizeBytes),
        sha256: 'workflow-generated-sha256',
        status: 'UPLOADED',
      },
    });

    return {
      recordingId: recording.id,
      hearingId: data.hearingId,
      status: recording.status,
      nextStep: 'Transcribe recording',
    };
  }

  async triggerAsrWorkflow(recordingId: string, language: 'ky' | 'ru' = 'ky') {
    const recording = await this.prisma.audioRecording.findUnique({ where: { id: recordingId } });
    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    const job = await this.prisma.transcriptionJob.create({
      data: {
        recordingId,
        language,
        status: 'QUEUED',
        progressPercent: 0,
      },
    });

    return {
      transcriptJobId: job.id,
      recordingId,
      status: job.status,
      language,
      nextStep: 'Review transcript segments and build protocol',
    };
  }

  async exportProtocolWorkflow(protocolId: string) {
    const protocol = await this.prisma.protocolDocument.findUnique({
      where: { id: protocolId },
      include: { hearing: { include: { case: true } } },
    });

    if (!protocol) {
      throw new NotFoundException('Protocol not found');
    }

    const flatten = (value: unknown, prefix = ''): string[] => {
      if (value === null || value === undefined) return [];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const text = String(value).trim();
        return text ? [prefix ? `${prefix}: ${text}` : text] : [];
      }
      if (Array.isArray(value)) {
        return value.flatMap((item, index) => flatten(item, prefix ? `${prefix} ${index + 1}` : ''));
      }
      if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
          flatten(item, prefix ? `${prefix} / ${key}` : key),
        );
      }
      return [];
    };

    const contentLines = flatten(protocol.content);
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: 'Судебный протокол', heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Дело: ${protocol.hearing.case.caseNumber}` }),
          new Paragraph({ text: `Суд: ${protocol.hearing.case.courtName}` }),
          new Paragraph({ text: `Тип документа: ${protocol.kind}` }),
          new Paragraph({ text: `Версия: ${protocol.version}` }),
          new Paragraph({ text: `Статус: ${protocol.status}` }),
          new Paragraph({ text: '' }),
          ...(contentLines.length
            ? contentLines.map((line) => new Paragraph({ text: line }))
            : [new Paragraph({ text: 'В документе пока нет содержимого протокола.' })]),
        ],
      }],
    });

    const storageRoot = process.env.COURT_STORAGE_ROOT;
    if (!storageRoot) {
      throw new Error('COURT_STORAGE_ROOT must be configured');
    }
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const fileName = `protocol-${protocolId}-v${protocol.version}.docx`;
    const outputPath = join(storageRoot, 'exports', fileName);
    mkdirSync(dirname(outputPath), { recursive: true });
    const buffer = await Packer.toBuffer(doc);
    writeFileSync(outputPath, buffer, { flag: 'w', mode: 0o600 });

    await this.prisma.protocolDocument.update({
      where: { id: protocolId },
      data: { docxStorageKey: `exports/${fileName}` },
    });

    return { protocolId, fileName, outputPath, status: protocol.status };
  }
}

