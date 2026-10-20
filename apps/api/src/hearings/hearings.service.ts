import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';

@Injectable()
export class HearingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHearingDto) {
    return this.prisma.hearing.create({
      data: {
        caseId: dto.caseId,
        instance: dto.instance,
        status: dto.status,
        recordingMode: dto.recordingMode,
        scheduledAt: new Date(dto.scheduledAt),
        timezone: dto.timezone ?? 'Asia/Bishkek',
        ruleSnapshot: (dto.ruleSnapshot ?? {}) as any,
        presidingJudgeName: dto.presidingJudgeName,
        secretaryName: dto.secretaryName,
        location: dto.location,
      },
    });
  }

  async getById(id: string) {
    const item = await this.prisma.hearing.findUnique({
      where: { id },
      include: { participants: true, recordings: true, segments: true },
    });

    if (!item) {
      throw new NotFoundException('Hearing not found');
    }

    return item;
  }

  async update(id: string, dto: UpdateHearingDto) {
    const existing = await this.prisma.hearing.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Hearing not found');
    }

    return this.prisma.hearing.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        ruleSnapshot: dto.ruleSnapshot ? (dto.ruleSnapshot as any) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.hearing.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Hearing not found');
    }

    await this.prisma.hearing.delete({ where: { id } });
    return { deleted: true, id };
  }
}
