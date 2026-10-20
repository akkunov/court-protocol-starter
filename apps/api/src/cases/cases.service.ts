import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string) {
    return this.prisma.courtCase.findMany({
      where: status ? { status: status as any } : undefined,
      include: { hearings: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateCaseDto) {
    return this.prisma.courtCase.create({
      data: {
        caseNumber: dto.caseNumber,
        title: dto.title,
        proceedingCode: dto.proceedingCode,
        courtName: dto.courtName,
        category: dto.category,
        legalProfileId: dto.legalProfileId,
      },
    });
  }

  async getById(id: string) {
    const item = await this.prisma.courtCase.findUnique({
      where: { id },
      include: { hearings: true },
    });

    if (!item) {
      throw new NotFoundException('Case not found');
    }

    return item;
  }

  async update(id: string, dto: UpdateCaseDto) {
    const existing = await this.prisma.courtCase.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Case not found');
    }

    return this.prisma.courtCase.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.courtCase.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Case not found');
    }

    await this.prisma.courtCase.delete({ where: { id } });
    return { deleted: true, id };
  }
}
