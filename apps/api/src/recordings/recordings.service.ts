import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRecordingDto } from './dto/update-recording.dto';

const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES || 1_073_741_824);
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set([
  'wav',
  'mp3',
  'm4a',
  'aac',
  'ogg',
  'webm',
  'flac',
]);

@Injectable()
export class RecordingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const item = await this.prisma.audioRecording.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Recording not found');
    return item;
  }

  async upload({ hearingId, file }: { hearingId: string; file: any }) {
    if (!hearingId) throw new BadRequestException('hearingId is required');
    if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.size <= 0) {
      throw new BadRequestException('A non-empty audio file is required');
    }
    if (file.size > MAX_AUDIO_BYTES) {
      throw new PayloadTooLargeException(
        `Audio file exceeds the configured limit of ${MAX_AUDIO_BYTES} bytes`,
      );
    }

    const mimeType = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported audio MIME type');
    }

    const originalExtension = String(file.originalname || '')
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (!originalExtension || !ALLOWED_EXTENSIONS.has(originalExtension)) {
      throw new BadRequestException('Unsupported audio file extension');
    }

    const hearing = await this.prisma.hearing.findUnique({ where: { id: hearingId } });
    if (!hearing) throw new NotFoundException('Hearing not found');

    const storageRoot = process.env.COURT_STORAGE_ROOT;
    if (!storageRoot) {
      throw new Error('COURT_STORAGE_ROOT must be configured');
    }

    const safeFileName = `${Date.now()}-${randomUUID()}.${originalExtension}`;
    const relativeStorageKey = `recordings/${hearingId}/${safeFileName}`;
    const hearingDir = join(storageRoot, 'recordings', hearingId);
    const absolutePath = join(hearingDir, safeFileName);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    mkdirSync(hearingDir, { recursive: true });
    writeFileSync(absolutePath, file.buffer, { flag: 'wx', mode: 0o600 });

    try {
      return await this.prisma.audioRecording.create({
        data: {
          hearingId,
          storageKey: relativeStorageKey,
          originalName: String(file.originalname || safeFileName).slice(0, 255),
          mimeType,
          sizeBytes: BigInt(file.size),
          sha256,
          status: 'UPLOADED',
        },
      });
    } catch (error) {
      // Avoid leaving an orphaned audio file if the database insert fails.
      const { unlinkSync } = await import('node:fs');
      try {
        unlinkSync(absolutePath);
      } catch {
        // Preserve the original database error.
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateRecordingDto) {
    const existing = await this.prisma.audioRecording.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recording not found');

    return this.prisma.audioRecording.update({
      where: { id },
      data: {
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        status: dto.status as any,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.audioRecording.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recording not found');

    // Metadata deletion alone is not a retention-safe physical deletion workflow.
    await this.prisma.audioRecording.delete({ where: { id } });
    return { deleted: true, id };
  }
}
