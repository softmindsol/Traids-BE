import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { Trade } from '../schema/job.schema';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsEnum(Trade)
  @IsOptional()
  trade?: Trade;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  siteAddress?: string;

  @IsDateString()
  @IsOptional()
  timelineStartDate?: string;

  @IsDateString()
  @IsOptional()
  timelineEndDate?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsArray()
  @IsOptional()
  documents?: string[];

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  workersRequired?: number;
}
