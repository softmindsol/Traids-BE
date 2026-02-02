import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray } from 'class-validator';

export class CreateJobApplicationDto {
    @IsString()
    @IsNotEmpty()
    jobId: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    proposedDailyRate?: number;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    documents?: string[]; // If documents are uploaded separately first
}
