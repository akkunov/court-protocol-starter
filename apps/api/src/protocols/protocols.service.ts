import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProtocolDto } from './dto/create-protocol.dto';

@Injectable()
export class ProtocolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const item = await this.prisma.protocolDocument.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Protocol not found');
    }

    return item;
  }

  async create(dto: CreateProtocolDto) {
    return this.prisma.protocolDocument.create({
      data: {
        hearingId: dto.hearingId,
        templateId: dto.templateId,
        version: dto.version,
        kind: dto.kind,
        content: (dto.content ?? {}) as any,
        legalRuleSnapshot: (dto.legalRuleSnapshot ?? {}) as any,
        createdById: dto.createdById,
      },
    });
  }
}
