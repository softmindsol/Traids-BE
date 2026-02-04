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
import { OfferService } from '../offer/offer.service';
import { Offer } from '../offer/schema/offer.schema';
import { Status } from './schema/job.schema';

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobApplicationService: JobApplicationService,
    private readonly offerService: OfferService,
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
    const companyId = job.company['_id'] ? job.company['_id'].toString() : job.company.toString();
    const isOwner = req.user.userType === 'company' && companyId === req.user.sub;

    // Handle OFFER type jobs
    if (job.typeOfJob === 'offer') {
      let offers: Offer[] = [];
      let acceptedOffer: Offer | null = null;

      if (isOwner) {
        // If job is pending, show all offers sent
        if (job.status === Status.PENDING) {
          offers = await this.offerService.getOffersForJob(id);
          return {
            message: 'Job retrieved successfully',
            data: {
              ...job.toObject(),
              offers,
            },
          };
        }

        // If job is accepted/in_progress/completed, show the accepted offer
        if (job.assignedTo) {
          acceptedOffer = await this.offerService.getAcceptedOffer(id);
          return {
            message: 'Job retrieved successfully',
            data: {
              ...job.toObject(),
              acceptedOffer,
            },
          };
        }
      }

      // For non-owners viewing offer jobs


      return {
        message: 'Job retrieved successfully',
        data: job,
      };
    }

    // Handle REQUEST type jobs (original logic)
    let applications: JobApplication[] = [];
    let assignedApplication: JobApplication | null = null;

    // If job is not pending and has assignedTo, fetch the accepted application
    if (job.assignedTo) {
      assignedApplication = await this.jobApplicationService.getAcceptedApplication(id);
    }

    if (isOwner) {
      applications = await this.jobApplicationService.getApplicationsForJob(id, req.user.sub);

      return {
        message: 'Job retrieved successfully',
        data: {
          ...job.toObject(),
          applications,
          assignedApplication,
        },
      };
    }

    // For subcontractors or non-owner companies, just return job details
    if (assignedApplication) {
      return {
        message: 'Job retrieved successfully',
        data: {
          ...job.toObject(),
          assignedApplication,
        },
      };
    }

    return {
      message: 'Job retrieved successfully',
      data: job,
    };
  }
}
