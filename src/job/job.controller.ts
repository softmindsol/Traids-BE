import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Query,
  UseInterceptors,
  UploadedFiles,
  Param,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SubcontractorGuard } from '../auth/guards/subcontractor.guard';
import { JobApplicationService } from '../job-application/job-application.service';
import { JobApplication } from '../job-application/schema/job-application.schema';

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobApplicationService: JobApplicationService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('documents', 10))
  async createJob(
    @Body() createJobDto: CreateJobDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const job = await this.jobService.createJob(createJobDto, req.user.sub, files);

    return {
      message: 'Job created successfully',
      data: job,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getMyJobs(@Request() req) {
    const jobs = await this.jobService.getJobsByCompany(req.user.sub);

    return {
      message: 'Jobs retrieved successfully',
      count: jobs.length,
      data: jobs,
    };
  }

  @Get('available')
  @UseGuards(JwtAuthGuard, SubcontractorGuard)
  async getAvailableJobs(@Query() filterJobsDto: FilterJobsDto) {
    const filters = {
      trade: filterJobsDto.trade,
      maxHourlyRate: filterJobsDto.maxHourlyRate,
      location: filterJobsDto.location,
      startDate: filterJobsDto.startDate ? new Date(filterJobsDto.startDate) : undefined,
    };

    const jobs = await this.jobService.getAllJobsWithFilters(filters);

    return {
      message: 'Available jobs retrieved successfully',
      count: jobs.length,
      data: jobs,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getJobById(@Param('id') id: string, @Request() req) {
    const job = await this.jobService.getJobById(id);
    let applications: JobApplication[] = [];

    // If user is company and owner of the job, fetch applications
    // Check if company is ObjectId or populated object
    const companyId = job.company['_id'] ? job.company['_id'].toString() : job.company.toString();

    if (req.user.userType === 'company' && companyId === req.user.sub) {
      applications = await this.jobApplicationService.getApplicationsForJob(id, req.user.sub);

      return {
        message: 'Job retrieved successfully',
        data: {
          ...job.toObject(),
          applications,
        },
      };
    }

    // For subcontractors or non-owner companies, just return job details
    return {
      message: 'Job retrieved successfully',
      data: job,
    };
  }
}
