import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobApplicationController } from './job-application.controller';
import { JobApplicationService } from './job-application.service';
import { JobApplication, JobApplicationSchema } from './schema/job-application.schema';
import { Job, JobSchema } from '../job/schema/job.schema';
import { Subcontractor, SubcontractorSchema } from '../subcontractor/schema/subcontractor.schema';
import { S3UploadService } from '../common/service/s3-upload.service';
import { SocketModule } from '../socket/socket.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: JobApplication.name, schema: JobApplicationSchema },
            { name: Job.name, schema: JobSchema },
            { name: Subcontractor.name, schema: SubcontractorSchema },
        ]),
        SocketModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [JobApplicationController],
    providers: [JobApplicationService, S3UploadService],
    exports: [JobApplicationService],
})
export class JobApplicationModule { }
