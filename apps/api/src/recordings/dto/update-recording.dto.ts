import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum RecordingStatusDto {
  CREATED = 'CREATED',
  RECORDING = 'RECORDING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETENTION_HOLD = 'RETENTION_HOLD',
  DELETED = 'DELETED',
}

export class UpdateRecordingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ required: false, enum: RecordingStatusDto })
  @IsOptional()
  @IsEnum(RecordingStatusDto)
  status?: RecordingStatusDto;
}
