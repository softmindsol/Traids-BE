import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Job, JobSchema } from './schema/job.schema';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobApplicationModule } from '../job-application/job-application.module';
import { OfferModule } from '../offer/offer.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    JobApplicationModule,
    OfferModule,
    ComplianceModule,
    CommonModule,
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule { }
