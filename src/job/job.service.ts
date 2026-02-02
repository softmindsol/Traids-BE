import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './schema/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { S3UploadService } from '../common/service/s3-upload.service';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private s3UploadService: S3UploadService,
  ) { }

  async createJob(
    createJobDto: CreateJobDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<JobDocument> {
    try {
      let documentUrls: string[] = [];

      // Upload documents to S3 if provided
      if (files && files.length > 0) {
        documentUrls = await this.s3UploadService.uploadMultipleFiles(
          files,
          'jobs/documents',
        );
      }

      const job = new this.jobModel({
        company: new Types.ObjectId(userId),
        jobTitle: createJobDto.jobTitle,
        trade: createJobDto.trade,
        description: createJobDto.description,
        siteAddress: createJobDto.siteAddress,
        timelineStartDate: new Date(createJobDto.timelineStartDate),
        timelineEndDate: new Date(createJobDto.timelineEndDate),
        hourlyRate: createJobDto.hourlyRate,
        typeOfJob: 'request',
        projectDocuments: documentUrls.length > 0 ? documentUrls : createJobDto.documents || [],
      });

      return await job.save();
    } catch (error) {
      throw new HttpException(
        'Failed to create job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getJobsByCompany(companyId: string): Promise<JobDocument[]> {
    try {
      console.log(companyId);
      return await this.jobModel
        .find({ company: new Types.ObjectId(companyId) })
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
  }): Promise<JobDocument[]> {
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
  async getJobById(jobId: string): Promise<JobDocument> {
    try {
      const job = await this.jobModel.findById(jobId)
        .populate('company', 'companyName workEmail phoneNumber headOfficeAddress')
        .populate('assignedTo', 'fullName email primaryTrade profileImage')
        .exec();

      if (!job) {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }
      return job;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
