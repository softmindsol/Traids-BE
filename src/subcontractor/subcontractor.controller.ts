import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SubcontractorService } from './subcontractor.service';
import { SignUpSubcontractorDto } from './dto/signup-subcontractor.dto';

@Controller('subcontractor')
export class SubcontractorController {
  private readonly logger = new Logger(SubcontractorController.name);

  constructor(private readonly subcontractorService: SubcontractorService) {}

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
}
