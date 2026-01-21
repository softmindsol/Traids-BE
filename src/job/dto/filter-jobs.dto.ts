import { IsOptional, IsEnum, IsNumber, IsString, IsDateString } from 'class-validator';
import { Trade } from '../schema/job.schema';

export class FilterJobsDto {
  @IsOptional()
  @IsEnum(Trade)
  trade?: Trade;

  @IsOptional()
  @IsNumber()
  maxHourlyRate?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
