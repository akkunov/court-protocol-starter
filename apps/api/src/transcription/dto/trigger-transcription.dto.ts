import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TriggerTranscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @ApiProperty({ required: false, default: 'ky', enum: ['ky', 'ru'] })
  @IsOptional()
  @IsString()
  @IsIn(['ky', 'ru'])
  language?: 'ky' | 'ru';
}

