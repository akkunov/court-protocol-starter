import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum HearingStatusDto {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CourtInstanceDto {
  FIRST_INSTANCE = 'FIRST_INSTANCE',
  APPEAL = 'APPEAL',
  CASSATION = 'CASSATION',
}

export enum RecordingModeDto {
  WRITTEN_PROTOCOL_WITH_AV = 'WRITTEN_PROTOCOL_WITH_AV',
  AV_WITH_SHORT_PROTOCOL = 'AV_WITH_SHORT_PROTOCOL',
  DIGITAL_AV_IS_PROTOCOL = 'DIGITAL_AV_IS_PROTOCOL',
}

export class CreateHearingDto {
  @ApiProperty({ type: String, example: '00000000-0000-0000-0000-000000000003' })
  @IsUUID()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({ enum: CourtInstanceDto, example: CourtInstanceDto.FIRST_INSTANCE })
  @IsEnum(CourtInstanceDto)
  instance: CourtInstanceDto;

  @ApiProperty({ enum: HearingStatusDto, example: HearingStatusDto.PLANNED })
  @IsEnum(HearingStatusDto)
  status: HearingStatusDto;

  @ApiProperty({ enum: RecordingModeDto, example: RecordingModeDto.WRITTEN_PROTOCOL_WITH_AV })
  @IsEnum(RecordingModeDto)
  recordingMode: RecordingModeDto;

  @ApiProperty({ type: String, example: '2026-10-20T10:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ type: String, example: 'Asia/Bishkek' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ type: String, example: 'Сарымсакова А. А.' })
  @IsOptional()
  @IsString()
  presidingJudgeName?: string;

  @ApiPropertyOptional({ type: String, example: 'Иванова Н. П.' })
  @IsOptional()
  @IsString()
  secretaryName?: string;

  @ApiPropertyOptional({ type: String, example: 'Зал заседаний №2' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: Object, example: { profile: 'APC' } })
  @IsOptional()
  ruleSnapshot?: Record<string, unknown>;
}
