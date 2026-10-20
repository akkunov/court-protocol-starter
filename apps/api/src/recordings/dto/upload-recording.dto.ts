import { ApiProperty } from '@nestjs/swagger';

export class UploadRecordingDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Audio/video file' })
  file: any;

  @ApiProperty({ type: String, example: '00000000-0000-0000-0000-000000000004', description: 'Hearing ID' })
  hearingId: string;
}
