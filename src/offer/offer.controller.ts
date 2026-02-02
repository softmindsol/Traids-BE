import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

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
}
