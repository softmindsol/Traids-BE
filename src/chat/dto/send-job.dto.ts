import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class SendJobDto {
  @IsMongoId()
  @IsNotEmpty()
  subcontractorId: string;

  @IsMongoId()
  @IsNotEmpty()
  jobId: string;
}
