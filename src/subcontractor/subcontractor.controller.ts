
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SubcontractorService } from './subcontractor.service';
import { JobService } from '../job/job.service';
import { OfferService } from '../offer/offer.service';
import { SignUpSubcontractorDto } from './dto/signup-subcontractor.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subcontractor')
export class SubcontractorController {
  private readonly logger = new Logger(SubcontractorController.name);

  constructor(
    private readonly subcontractorService: SubcontractorService,
    private readonly jobService: JobService,
    private readonly offerService: OfferService,
  ) { }

  @Post('signup')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'insuranceDocuments', maxCount: 5 },
      { name: 'ticketsDocuments', maxCount: 5 },
      { name: 'certificationDocuments', maxCount: 5 },
      { name: 'profileImage', maxCount: 1 },
      { name: 'workExamples', maxCount: 10 },
    ]),
  )
  async signUp(
    @Body() signUpSubcontractorDto: SignUpSubcontractorDto,
    @UploadedFiles()
    files: {
      insuranceDocuments?: Express.Multer.File[];
      ticketsDocuments?: Express.Multer.File[];
      certificationDocuments?: Express.Multer.File[];
      profileImage?: Express.Multer.File[];
      workExamples?: Express.Multer.File[];
    },
  ) {
    // Check if subcontractor already exists
    const existingSubcontractor = await this.subcontractorService.findByEmail(
      signUpSubcontractorDto.email,
    );
    if (existingSubcontractor) {
      throw new HttpException(
        'Subcontractor with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const subcontractor = await this.subcontractorService.signUp(
      signUpSubcontractorDto,
      files,
    );

    this.logger.log(
      `Subcontractor signup successful - Email: ${signUpSubcontractorDto.email}, Name: ${signUpSubcontractorDto.fullName}`,
    );

    return {
      message: 'Subcontractor registered successfully',
    };
  }

  @Put('update-profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'insuranceDocuments', maxCount: 5 },
      { name: 'ticketsDocuments', maxCount: 5 },
      { name: 'certificationDocuments', maxCount: 5 },
      { name: 'profileImage', maxCount: 1 },
    ]),
  )
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateSubcontractorDto,
    @UploadedFiles()
    files: {
      insuranceDocuments?: Express.Multer.File[];
      ticketsDocuments?: Express.Multer.File[];
      certificationDocuments?: Express.Multer.File[];
      profileImage?: Express.Multer.File[];
    },
  ) {
    try {
      const userId = req.user.sub;

      const updatedProfile = await this.subcontractorService.updateProfile(
        userId,
        updateDto,
        files,
      );

      this.logger.log(`Subcontractor profile updated - ID: ${userId}`);

      return {
        message: 'Profile updated successfully',
        profile: updatedProfile,
      };
    } catch (error) {
      if (error.message === 'Subcontractor not found') {
        throw new HttpException('Subcontractor not found', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Email already in use') {
        throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message || 'Failed to update profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('bookings')
  @UseGuards(JwtAuthGuard)
  async getBookings(@Request() req) {
    try {
      const subcontractorId = req.user.sub;

      // Get offers with compliance documents
      const offers = await this.offerService.getOffersWithComplianceBySubcontractor(subcontractorId);

      // Get jobs where subcontractor is assigned
      const assignedJobs = await this.jobService.getJobsBySubcontractor(subcontractorId);

      // Filter offers by status
      const pendingOffers = offers.filter(offer => offer.status === 'pending');

      // Group assigned jobs by status
      const pendingJobs = assignedJobs.filter(job => job.status === 'pending');
      const inProgressJobs = assignedJobs.filter(job => job.status === 'in_progress');
      const completedJobs = assignedJobs.filter(job => job.status === 'completed');

      this.logger.log(`Fetched bookings for subcontractor - ID: ${subcontractorId}`);

      return {
        offers: pendingOffers,
        pending: pendingJobs,
        inProgress: inProgressJobs,
        completed: completedJobs,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch bookings: ${error.message}`);
      throw new HttpException(
        'Failed to fetch bookings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
