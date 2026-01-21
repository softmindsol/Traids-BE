import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { SignUpCompanyDto } from './dto/signup-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('signup')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'companyDocuments', maxCount: 10 },
      { name: 'insuranceCertificate', maxCount: 1 },
      { name: 'healthAndSafetyPolicy', maxCount: 1 },
    ]),
  )
  async signUp(
    @Body() signUpCompanyDto: SignUpCompanyDto,
    @UploadedFiles()
    files: {
      companyDocuments?: Express.Multer.File[];
      insuranceCertificate?: Express.Multer.File[];
      healthAndSafetyPolicy?: Express.Multer.File[];
    },
  ) {
    // Check if company already exists
    const existingCompanyByEmail = await this.companyService.findByEmail(
      signUpCompanyDto.workEmail,
    );
    if (existingCompanyByEmail) {
      throw new HttpException(
        'Company with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingCompanyByRegNo =
      await this.companyService.findByRegistrationNumber(
        signUpCompanyDto.registrationNumber,
      );
    if (existingCompanyByRegNo) {
      throw new HttpException(
        'Company with this registration number already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const company = await this.companyService.signUp(signUpCompanyDto, files);

    return {
      message: 'Company registered successfully',
    };
  }
}
