import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, IsDateString, IsEnum } from 'class-validator';
import { Trade } from '../../job/schema/job.schema';

export class CreateOfferDto {
  // Subcontractor to send offer to
  @IsNotEmpty()
  @IsString()
  subcontractorId: string;

  // Job details - same as CreateJobDto
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

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;
    
  @IsArray()
  @IsOptional()
  documents?: string[];

  // Offer-specific fields
  @IsOptional()
  @IsNumber()
  platformFeePercent?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
