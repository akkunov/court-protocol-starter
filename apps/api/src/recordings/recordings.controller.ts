import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecordingsService } from './recordings.service';
import { UploadRecordingDto } from './dto/upload-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { ApiKeyGuard } from '../security/api-key.guard';

@ApiTags('recordings')
@ApiBearerAuth()
@Controller('recordings')
@UseGuards(ApiKeyGuard)
export class RecordingsController {
  constructor(private readonly service: RecordingsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get recording metadata' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload hearing recording' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadRecordingDto })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: Number(process.env.MAX_AUDIO_BYTES || 1_073_741_824), files: 1 },
    }),
  )
  upload(@Body() body: { hearingId: string }, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Audio file is required');
    return this.service.upload({ hearingId: body.hearingId, file });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recording metadata' })
  update(@Param('id') id: string, @Body() dto: UpdateRecordingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete recording metadata' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
