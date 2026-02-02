import { IsOptional, IsString } from 'class-validator';

export class RespondToApplicationDto {
    @IsOptional()
    @IsString()
    responseMessage?: string;
}
