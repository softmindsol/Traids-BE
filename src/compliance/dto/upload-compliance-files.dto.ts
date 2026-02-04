import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UploadComplianceFilesDto {
    @IsNotEmpty()
    @IsEnum(['RAMS', 'permits', 'reports', 'incidents', 'drawings'])
    fileType: 'RAMS' | 'permits' | 'reports' | 'incidents' | 'drawings';
}
