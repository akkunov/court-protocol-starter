import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HearingsService } from './hearings.service';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('hearings')
@ApiBearerAuth()
@Controller('hearings')
@UseGuards(ApiKeyGuard)
export class HearingsController {
  constructor(private readonly service: HearingsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get hearing by id' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create hearing' })
  @ApiBody({ type: CreateHearingDto })
  create(@Body() dto: CreateHearingDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hearing' })
  update(@Param('id') id: string, @Body() dto: UpdateHearingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete hearing' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
