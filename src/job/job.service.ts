import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './schema/job.schema';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async createJob(createJobDto: CreateJobDto, userId: string): Promise<Job> {
    try {
      const job = new this.jobModel({
        company: userId,
        jobTitle: createJobDto.jobTitle,
        trade: createJobDto.trade,
        description: createJobDto.description,
        siteAddress: createJobDto.siteAddress,
        timelineStartDate: new Date(createJobDto.timelineStartDate),
        timelineEndDate: new Date(createJobDto.timelineEndDate),
        hourlyRate: createJobDto.hourlyRate,
        projectDocuments: createJobDto.documents || [],
      });

      return await job.save();
    } catch (error) {
      throw new HttpException(
        'Failed to create job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    try {
      return await this.jobModel
        .find({ company: companyId })
        .populate('company', 'companyName workEmail')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch jobs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllJobsWithFilters(filters: {
    trade?: string;
    maxHourlyRate?: number;
    location?: string;
    startDate?: Date;
  }): Promise<Job[]> {
    try {
      const query: any = {};

      // Only show unassigned jobs
      query.assignedTo = null;

      // Filter by trade type
      if (filters.trade) {
        query.trade = filters.trade;
      }

      // Filter by hourly rate - find jobs near the maximum hourly rate
      // Looking for jobs within ±10 of the max rate or less than max rate
      if (filters.maxHourlyRate) {
        const rateRange = 10; // £10 range
        query.hourlyRate = {
          $gte: Math.max(0, filters.maxHourlyRate - rateRange),
          $lte: filters.maxHourlyRate,
        };
      }

      // Filter by location (case-insensitive partial match)
      if (filters.location) {
        query.siteAddress = { $regex: filters.location, $options: 'i' };
      }

      // Filter by start date - find jobs that start on or after the given date
      if (filters.startDate) {
        query.timelineStartDate = { $gte: filters.startDate };
      }

      return await this.jobModel
        .find(query)
        .populate('company', 'companyName workEmail phoneNumber headOfficeAddress')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch jobs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
