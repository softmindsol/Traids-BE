import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Job, JobSchema } from './schema/job.schema';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { S3UploadService } from '../common/service/s3-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [JobController],
  providers: [JobService, S3UploadService],
  exports: [JobService],
})
export class JobModule {}
