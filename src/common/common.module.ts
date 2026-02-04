import { Module } from '@nestjs/common';
import { S3UploadService } from './service/s3-upload.service';
import { EmailService } from './service/email.service';

@Module({
    providers: [S3UploadService, EmailService],
    exports: [S3UploadService, EmailService],
})
export class CommonModule { }
