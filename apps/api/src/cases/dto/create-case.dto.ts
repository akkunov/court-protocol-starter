import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ProceedingCodeDto {
  APC = 'APC',
  GPK = 'GPK',
  UPK = 'UPK',
}

export class CreateCaseDto {
  @ApiProperty({ type: String, example: '1-123/2026' })
  @IsString()
  @IsNotEmpty()
  caseNumber: string;

  @ApiProperty({ type: String, example: 'Административное дело' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ProceedingCodeDto, example: ProceedingCodeDto.APC })
  @IsEnum(ProceedingCodeDto)
  proceedingCode: ProceedingCodeDto;

  @ApiProperty({ type: String, example: 'Бишкекский городской суд' })
  @IsString()
  @IsNotEmpty()
  courtName: string;

  @ApiPropertyOptional({ type: String, example: 'administrative' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ type: String, example: '00000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsNotEmpty()
  legalProfileId: string;
}
