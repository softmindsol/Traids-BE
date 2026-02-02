import { IsOptional, IsEnum } from 'class-validator';
import { ApplicationStatus } from '../schema/job-application.schema';

export class FilterApplicationsDto {
    @IsOptional()
    @IsEnum(ApplicationStatus)
    status?: ApplicationStatus;
}
