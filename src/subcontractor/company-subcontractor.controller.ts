import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CompanySubcontractorService } from './company-subcontractor.service';
import { FilterSubcontractorsDto } from './dto/filter-subcontractors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('company/subcontractors')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CompanySubcontractorController {
  constructor(
    private readonly companySubcontractorService: CompanySubcontractorService,
  ) {}

  @Get()
  async getAllSubcontractors(@Query() filterDto: FilterSubcontractorsDto) {
    const subcontractors =
      await this.companySubcontractorService.getAllSubcontractorsWithFilters(
        filterDto,
      );

    return {
      message: 'Subcontractors retrieved successfully',
      count: subcontractors.length,
      data: subcontractors,
    };
  }

  @Get(':id')
  async getSubcontractorById(@Param('id') id: string) {
    const subcontractor =
      await this.companySubcontractorService.getSubcontractorById(id);

    if (!subcontractor) {
      throw new HttpException('Subcontractor not found', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Subcontractor retrieved successfully',
      data: subcontractor,
    };
  }
}
