import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { SignUpCompanyDto } from './dto/signup-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('signup')
  async signUp(@Body() signUpCompanyDto: SignUpCompanyDto) {
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

    const company = await this.companyService.signUp(signUpCompanyDto);

    return {
      message: 'Company registered successfully',
    };
  }
}
