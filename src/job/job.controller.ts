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
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SubcontractorGuard } from '../auth/guards/subcontractor.guard';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createJob(@Body() createJobDto: CreateJobDto, @Request() req) {
    const job = await this.jobService.createJob(createJobDto, req.user.sub);
    
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
}
