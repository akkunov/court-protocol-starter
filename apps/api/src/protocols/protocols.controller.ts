import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProtocolsService } from './protocols.service';
import { CreateProtocolDto } from './dto/create-protocol.dto';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('protocols')
@ApiBearerAuth()
@Controller('protocols')
@UseGuards(ApiKeyGuard)
export class ProtocolsController {
  constructor(private readonly service: ProtocolsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get protocol document' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create protocol draft' })
  @ApiBody({ type: CreateProtocolDto })
  create(@Body() dto: CreateProtocolDto) {
    return this.service.create(dto);
  }
}

