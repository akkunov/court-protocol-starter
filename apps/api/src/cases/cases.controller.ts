import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('cases')
@ApiBearerAuth()
@Controller('cases')
@UseGuards(ApiKeyGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @ApiOperation({ summary: 'List cases' })
  @ApiQuery({ name: 'status', required: false })
  list(@Query('status') status?: string) {
    return this.casesService.list(status);
  }

  @Post()
  @ApiOperation({ summary: 'Create a case' })
  @ApiBody({ type: CreateCaseDto })
  create(@Body() dto: CreateCaseDto) {
    return this.casesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by id' })
  getById(@Param('id') id: string) {
    return this.casesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update case' })
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete case' })
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }
}
