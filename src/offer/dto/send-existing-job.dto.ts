import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class SendExistingJobDto {
  @IsNotEmpty()
  @IsString()
  subcontractorId: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
