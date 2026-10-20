import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ProtocolKindDto {
  FULL_WRITTEN = 'FULL_WRITTEN',
  SHORT_WRITTEN = 'SHORT_WRITTEN',
  TRANSCRIPT = 'TRANSCRIPT',
}

export class CreateProtocolDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  hearingId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty()
  @IsNotEmpty()
  version: number;

  @ApiProperty({ enum: ProtocolKindDto })
  @IsEnum(ProtocolKindDto)
  kind: ProtocolKindDto;

  @ApiProperty({ required: false, default: {} })
  @IsOptional()
  content?: Record<string, unknown>;

  @ApiProperty({ required: false, default: {} })
  @IsOptional()
  legalRuleSnapshot?: Record<string, unknown>;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  createdById: string;
}

