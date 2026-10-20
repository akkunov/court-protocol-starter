import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRecordingDto } from './dto/update-recording.dto';

@Injectable()
export class RecordingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const item = await this.prisma.audioRecording.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Recording not found');
    }

    return item;
  }

  async upload({ hearingId, file }: { hearingId: string; file: any }) {
    if (!file) {
      throw new Error('Uploaded file is required');
    }

    const hearing = await this.prisma.hearing.findUnique({
      where: { id: hearingId },
    });

    if (!hearing) {
      throw new NotFoundException(`Hearing with id "${hearingId}" not found`);
    }

    const storageRoot = process.env.COURT_STORAGE_ROOT || '/srv/court-protocol-storage';
    const hearingDir = join(storageRoot, 'recordings', hearingId);
    if (!existsSync(hearingDir)) {
      mkdirSync(hearingDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}-${randomUUID()}.${file.originalname.split('.').pop() || 'bin'}`;
    const distPath = join(hearingDir, safeFileName);
    writeFileSync(distPath, file.buffer);

    const recording = await this.prisma.audioRecording.create({
      data: {
        hearingId,
        storageKey: `recordings/${hearingId}/${safeFileName}`,
        originalName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: BigInt(file.size),
        sha256: 'stub-sha256',
        status: 'UPLOADED',
      },
    });

    return recording;
  }

  async update(id: string, dto: UpdateRecordingDto) {
    const existing = await this.prisma.audioRecording.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Recording not found');
    }

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
    if (!existing) {
      throw new NotFoundException('Recording not found');
    }

    await this.prisma.audioRecording.delete({ where: { id } });
    return { deleted: true, id };
  }
}
