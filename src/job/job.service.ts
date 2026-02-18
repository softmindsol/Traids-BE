import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './schema/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { S3UploadService } from '../common/service/s3-upload.service';
import { ComplianceService } from '../compliance/compliance.service';
import { workerData } from 'worker_threads';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private s3UploadService: S3UploadService,
    private complianceService: ComplianceService,
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
        workersRequired: createJobDto.workersRequired,
      });

      const savedJob = await job.save();

      // Automatically create a compliance record for this job
      await this.complianceService.createCompliance(
        createJobDto.jobTitle,
        savedJob._id.toString(),
      );

      return savedJob;
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
    page?: number;
  }): Promise<{ jobs: JobDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = {};
      const page = filters.page || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      // Only show jobs that haven't reached their worker capacity
      // assignedTo.length < workersRequired
      query.$expr = { $lt: [{ $size: { $ifNull: ['$assignedTo', []] } }, '$workersRequired'] };
      query.status = 'pending'; // Only show jobs that are still pending (not accepted or completed)

      // Exclude offer-type jobs (subcontractors can only apply to request-type jobs)
      query.typeOfJob = { $ne: 'offer' };

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

      console.log('Job query:', JSON.stringify(query));

      const total = await this.jobModel.countDocuments(query);
      console.log('Total jobs found:', total);

      const jobs = await this.jobModel
        .find(query)
        .populate('company', 'companyName workEmail phoneNumber headOfficeAddress profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      return {
        jobs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
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
        .populate('company', 'companyName workEmail phoneNumber headOfficeAddress profileImage')
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

  /**
   * Manually start a job (change status to IN_PROGRESS)
   * Updates the timelineStartDate to current date/time
   */
  async startJob(jobId: string, companyId: string): Promise<JobDocument> {
    try {
      const job = await this.jobModel.findById(jobId);

      if (!job) {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }

      // Verify the job belongs to the company
      if (job.company.toString() !== companyId) {
        throw new HttpException('Unauthorized to start this job', HttpStatus.FORBIDDEN);
      }

      // Check if job is in PENDING status
      if (job.status !== 'pending') {
        throw new HttpException(
          `Job cannot be started. Current status: ${job.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update job status and start date
      const updatedJob = await this.jobModel.findByIdAndUpdate(
        jobId,
        {
          status: 'in_progress',
          timelineStartDate: new Date(),
        },
        { new: true },
      )
        .populate('company', 'companyName workEmail phoneNumber')
        .populate('assignedTo', 'fullName email primaryTrade')
        .exec();

      if (!updatedJob) {
        throw new HttpException('Failed to update job', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.logger.log(`Job started: ${updatedJob.jobTitle} (ID: ${jobId})`);

      // TODO: Send notifications to assigned workers
      // this.notificationService.notifyJobStarted(updatedJob);

      return updatedJob;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to start job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
