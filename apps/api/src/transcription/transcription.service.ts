import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerTranscriptionDto } from './dto/trigger-transcription.dto';

type AsrSegment = { start: number; end: number; text: string };
type AsrResult = {
  language: string;
  durationSeconds: number;
  segments: AsrSegment[];
};

@Injectable()
export class TranscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async trigger(dto: TriggerTranscriptionDto) {
    const recording = await this.prisma.audioRecording.findUnique({
      where: { storageKey: dto.storageKey },
    });
    if (!recording) {
      throw new NotFoundException('No recording found for the supplied storageKey');
    }

    const language = dto.language ?? 'ky';
    const job = await this.prisma.transcriptionJob.create({
      data: {
        recordingId: recording.id,
        language,
        status: 'RUNNING',
        progressPercent: 5,
        startedAt: new Date(),
        attemptCount: 1,
      },
    });

    await this.prisma.audioRecording.update({
      where: { id: recording.id },
      data: { status: 'PROCESSING', failureReason: null },
    });

    const asrBaseUrl = (
      process.env.ASR_SERVICE_URL ||
      (process.env.NODE_ENV === 'production' ? 'http://asr:8000' : 'http://localhost:8000')
    ).replace(/\/$/, '');

    try {
      const apiKey = process.env.ASR_SERVICE_API_KEY;
      if (!apiKey || apiKey === 'change-me' || apiKey.startsWith('replace-with-')) {
        throw new ServiceUnavailableException('ASR_SERVICE_API_KEY is not configured');
      }

      const response = await fetch(`${asrBaseUrl}/internal/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          storage_key: recording.storageKey,
          language,
        }),
        signal: AbortSignal.timeout(Number(process.env.ASR_TIMEOUT_MS || 7_200_000)),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          `ASR service responded with HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`,
        );
      }

      const result = (await response.json()) as AsrResult;
      if (!Array.isArray(result.segments)) {
        throw new Error('ASR returned an invalid segments payload');
      }

      const lastSegment = await this.prisma.transcriptSegment.aggregate({
        where: { hearingId: recording.hearingId },
        _max: { sequence: true },
      });
      const firstSequence = (lastSegment._max.sequence ?? 0) + 1;

      await this.prisma.$transaction(async (tx) => {
        if (result.segments.length) {
          await tx.transcriptSegment.createMany({
            data: result.segments.map((segment, index) => ({
              hearingId: recording.hearingId,
              recordingId: recording.id,
              sequence: firstSequence + index,
              startMs: BigInt(Math.max(0, Math.round(segment.start * 1000))),
              endMs: BigInt(Math.max(0, Math.round(segment.end * 1000))),
              text: segment.text,
              language: result.language || language,
              status: 'RECOGNIZED',
              engine: 'faster-whisper',
              modelVersion: 'large-v3',
            })),
          });
        }

        await tx.transcriptionJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            progressPercent: 100,
            finishedAt: new Date(),
            errorCode: null,
            errorMessage: null,
          },
        });

        await tx.audioRecording.update({
          where: { id: recording.id },
          data: {
            status: 'COMPLETED',
            durationMs:
              typeof result.durationSeconds === 'number'
                ? BigInt(Math.max(0, Math.round(result.durationSeconds * 1000)))
                : undefined,
            completedAt: new Date(),
            failureReason: null,
          },
        });
      });

      return {
        jobId: job.id,
        recordingId: recording.id,
        hearingId: recording.hearingId,
        status: 'COMPLETED',
        language: result.language || language,
        durationSeconds: result.durationSeconds,
        segmentsSaved: result.segments.length,
        segments: result.segments,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ASR error';
      await this.prisma.$transaction([
        this.prisma.transcriptionJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            errorCode: 'ASR_FAILED',
            errorMessage: message.slice(0, 2000),
          },
        }),
        this.prisma.audioRecording.update({
          where: { id: recording.id },
          data: { status: 'FAILED', failureReason: message.slice(0, 2000) },
        }),
      ]);
      throw error;
    }
  }
}
