import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TranscriptionService } from './transcription.service';
import { TriggerTranscriptionDto } from './dto/trigger-transcription.dto';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('transcription')
@ApiBearerAuth()
@Controller('transcription')
@UseGuards(ApiKeyGuard)
export class TranscriptionController {
  constructor(private readonly service: TranscriptionService) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger ASR transcription for a recording' })
  @ApiBody({ type: TriggerTranscriptionDto })
  trigger(@Body() dto: TriggerTranscriptionDto) {
    return this.service.trigger(dto);
  }
}

