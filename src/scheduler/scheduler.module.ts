import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { JobSchedulerService } from './job-scheduler.service';
import { Job, JobSchema } from '../job/schema/job.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
  ],
  providers: [SchedulerService, JobSchedulerService],
  exports: [SchedulerService, JobSchedulerService],
})
export class SchedulerModule {}
