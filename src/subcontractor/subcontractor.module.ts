import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Subcontractor, SubcontractorSchema } from './schema/subcontractor.schema';
import { Job, JobSchema } from '../job/schema/job.schema';
import { SubcontractorService } from './subcontractor.service';
import { SubcontractorController } from './subcontractor.controller';
import { CompanySubcontractorService } from './company-subcontractor.service';
import { CompanySubcontractorController } from './company-subcontractor.controller';
import { S3UploadService } from '../common/service/s3-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subcontractor.name, schema: SubcontractorSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SubcontractorController, CompanySubcontractorController],
  providers: [SubcontractorService, CompanySubcontractorService, S3UploadService],
  exports: [SubcontractorService, CompanySubcontractorService],
})
export class SubcontractorModule {}
