import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { PrimaryTrade } from '../schema/subcontractor.schema';

export class FilterSubcontractorsDto {
  @IsOptional()
  @IsEnum(PrimaryTrade)
  primaryTrade?: PrimaryTrade;

  @IsOptional()
  @IsNumber()
  minYearsOfExperience?: number;

  @IsOptional()
  @IsNumber()
  maxHourlyRate?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  availability?: string;
}
