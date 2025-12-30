import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubcontractorService } from './subcontractor.service';
import { SignUpSubcontractorDto } from './dto/signup-subcontractor.dto';
@Controller('subcontractor')
export class SubcontractorController {
  constructor(private readonly subcontractorService: SubcontractorService) {}

  @Post('signup')
  async signUp(@Body() signUpSubcontractorDto: SignUpSubcontractorDto) {
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

    const subcontractor =
      await this.subcontractorService.signUp(signUpSubcontractorDto);

    return {
      message: 'Subcontractor registered successfully',
    };
  }
}
