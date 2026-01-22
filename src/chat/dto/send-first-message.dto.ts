import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendFirstMessageDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  subcontractorId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
