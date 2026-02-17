import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

/**
 * Generic Scheduler Service
 * Provides reusable cron job functionality for the entire application
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  /**
   * Add a dynamic cron job programmatically
   * @param name Unique name for the cron job
   * @param cronTime Cron expression (e.g., '0 * * * * *' for every minute)
   * @param callback Function to execute
   */
  addCronJob(name: string, cronTime: string, callback: () => void): void {
    const job = new CronJob(cronTime, () => {
      this.logger.log(`Executing cron job: ${name}`);
      callback();
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.log(`Cron job '${name}' added with schedule: ${cronTime}`);
  }

  /**
   * Remove a dynamic cron job
   * @param name Name of the cron job to remove
   */
  removeCronJob(name: string): void {
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.warn(`Cron job '${name}' removed`);
  }

  /**
   * Get a cron job by name
   * @param name Name of the cron job
   */
  getCronJob(name: string): CronJob {
    return this.schedulerRegistry.getCronJob(name);
  }

  /**
   * Add a timeout task
   * @param name Unique name for the timeout
   * @param milliseconds Time in milliseconds
   * @param callback Function to execute
   */
  addTimeout(name: string, milliseconds: number, callback: () => void): void {
    const timeout = setTimeout(() => {
      this.logger.log(`Executing timeout: ${name}`);
      callback();
    }, milliseconds);

    this.schedulerRegistry.addTimeout(name, timeout);
    this.logger.log(`Timeout '${name}' added for ${milliseconds}ms`);
  }

  /**
   * Remove a timeout task
   * @param name Name of the timeout to remove
   */
  removeTimeout(name: string): void {
    this.schedulerRegistry.deleteTimeout(name);
    this.logger.warn(`Timeout '${name}' removed`);
  }

  /**
   * Add an interval task
   * @param name Unique name for the interval
   * @param milliseconds Interval in milliseconds
   * @param callback Function to execute
   */
  addInterval(name: string, milliseconds: number, callback: () => void): void {
    const interval = setInterval(() => {
      this.logger.log(`Executing interval: ${name}`);
      callback();
    }, milliseconds);

    this.schedulerRegistry.addInterval(name, interval);
    this.logger.log(`Interval '${name}' added for every ${milliseconds}ms`);
  }

  /**
   * Remove an interval task
   * @param name Name of the interval to remove
   */
  removeInterval(name: string): void {
    this.schedulerRegistry.deleteInterval(name);
    this.logger.warn(`Interval '${name}' removed`);
  }
}
