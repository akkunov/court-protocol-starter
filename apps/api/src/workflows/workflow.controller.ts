import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflow')
@UseGuards(ApiKeyGuard)
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Post('case')
  @ApiOperation({ summary: 'Create case and start workflow' })
  createCase(@Body() body: any) {
    return this.service.createCaseWorkflow(body);
  }

  @Post('hearing')
  @ApiOperation({ summary: 'Create hearing in workflow' })
  createHearing(@Body() body: any) {
    return this.service.createHearingWorkflow(body);
  }

  @Post('recording')
  @ApiOperation({ summary: 'Create recording record and queue ASR workflow' })
  createRecording(@Body() body: any) {
    return this.service.createRecordingWorkflow(body);
  }

  @Post('transcription/:recordingId')
  @ApiOperation({ summary: 'Queue transcription for a recording' })
  queueTranscription(@Param('recordingId') recordingId: string, @Body() body: { language?: 'ky' | 'ru' }) {
    return this.service.triggerAsrWorkflow(recordingId, body.language ?? 'ky');
  }

  @Post('protocol/export/:protocolId')
  @ApiOperation({ summary: 'Export protocol to DOCX' })
  exportProtocol(@Param('protocolId') protocolId: string) {
    return this.service.exportProtocolWorkflow(protocolId);
  }
}

