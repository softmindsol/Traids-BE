import { IsString, IsNotEmpty, IsEnum, IsNumber, IsDateString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { Trade } from '../schema/job.schema';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsEnum(Trade)
  @IsNotEmpty()
  trade: Trade;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  siteAddress: string;

  @IsDateString()
  @IsNotEmpty()
  timelineStartDate: string;

  @IsDateString()
  @IsNotEmpty()
  timelineEndDate: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @IsArray()
  @IsOptional()
  documents?: string[];

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  workersRequired: number;
}
