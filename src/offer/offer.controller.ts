import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  HttpCode,
  Param,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { SendExistingJobDto } from './dto/send-existing-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SubcontractorGuard } from '../auth/guards/subcontractor.guard';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('documents', 10))
  async sendOffer(
    @Body() createOfferDto: CreateOfferDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const offer = await this.offerService.sendOffer(
      createOfferDto,
      req.user.sub,
      files,
    );

    return {
      message: 'Offer sent successfully',
      data: offer,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getMyOffers(@Request() req) {
    const offers = await this.offerService.getOffersByCompany(req.user.sub);

    return {
      message: 'Offers retrieved successfully',
      count: offers.length,
      data: offers,
    };
  }

  @Post('send/:jobId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendExistingJobAsOffer(
    @Param('jobId') jobId: string,
    @Body() sendExistingJobDto: SendExistingJobDto,
    @Request() req,
  ) {
    const offer = await this.offerService.sendExistingJobAsOffer(
      jobId,
      sendExistingJobDto.subcontractorId,
      req.user.sub,
      sendExistingJobDto.expiresAt,
    );

    return {
      message: 'Existing job sent as offer successfully',
      data: offer,
    };
  }

  @Patch(':offerId/accept')
  @UseGuards(JwtAuthGuard, SubcontractorGuard)
  @HttpCode(HttpStatus.OK)
  async acceptOffer(
    @Param('offerId') offerId: string,
    @Request() req,
  ) {
    const offer = await this.offerService.acceptOffer(offerId, req.user.sub);

    return {
      message: 'Offer accepted successfully',
      data: offer,
    };
  }

  @Patch(':offerId/reject')
  @UseGuards(JwtAuthGuard, SubcontractorGuard)
  @HttpCode(HttpStatus.OK)
  async rejectOffer(
    @Param('offerId') offerId: string,
    @Request() req,
  ) {
    const offer = await this.offerService.rejectOffer(offerId, req.user.sub);

    return {
      message: 'Offer rejected successfully',
      data: offer,
    };
  }
}
