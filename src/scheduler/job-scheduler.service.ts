import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument, Status } from '../job/schema/job.schema';

/**
 * Job Scheduler Service
 * Handles automatic job status updates based on timeline dates
 */
@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  /**
   * Cron job that runs every hour to check for jobs that should start
   * Runs at minute 0 of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoStartJobs(): Promise<void> {
    this.logger.log('Running auto-start jobs cron...');

    try {
      const now = new Date();

      // Find all pending jobs where timelineStartDate has passed
      const jobsToStart = await this.jobModel.find({
        status: Status.PENDING,
        timelineStartDate: { $lte: now },
      });

      this.logger.log(`Found ${jobsToStart.length} jobs to auto-start`);

      // Update each job to IN_PROGRESS
      for (const job of jobsToStart) {
        await this.jobModel.findByIdAndUpdate(job._id, {
          status: Status.IN_PROGRESS,
          timelineStartDate: now,
        });

        this.logger.log(`Auto-started job: ${job.jobTitle} (ID: ${job._id})`);

        // TODO: Send notifications to assigned workers
        // this.notificationService.notifyJobStarted(job);
      }

      if (jobsToStart.length > 0) {
        this.logger.log(`Successfully auto-started ${jobsToStart.length} jobs`);
      }
    } catch (error) {
      this.logger.error('Error in auto-start jobs cron:', error);
    }
  }
}
