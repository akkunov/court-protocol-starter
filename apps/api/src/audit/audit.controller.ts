import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(ApiKeyGuard)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get(':entityType/:entityId')
  @ApiOperation({ summary: 'List audit log for entity' })
  getByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.service.getByEntity(entityType, entityId);
  }
}

