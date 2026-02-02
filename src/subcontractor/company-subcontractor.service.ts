import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subcontractor,
  SubcontractorDocument,
} from './schema/subcontractor.schema';
import { Job, JobDocument } from '../job/schema/job.schema';
import { FilterSubcontractorsDto } from './dto/filter-subcontractors.dto';

@Injectable()
export class CompanySubcontractorService {
  constructor(
    @InjectModel(Subcontractor.name)
    private subcontractorModel: Model<SubcontractorDocument>,
    @InjectModel(Job.name)
    private jobModel: Model<JobDocument>,
  ) { }

  async getAllSubcontractorsWithFilters(
    filters: FilterSubcontractorsDto,
  ): Promise<Subcontractor[]> {
    try {
      const query: any = {};
      // Filter by primary trade
      if (filters.primaryTrade) {
        query.primaryTrade = filters.primaryTrade;
      }

      // Filter by minimum years of experience
      if (filters.minYearsOfExperience) {
        query.yearsOfExperience = { $gte: filters.minYearsOfExperience };
      }

      // Filter by maximum hourly rate
      if (filters.maxHourlyRate) {
        query.hourlyRate = { $lte: filters.maxHourlyRate };
      }

      // Filter by location (city or postcode)
      if (filters.location) {
        query.$or = [
          { cityLocation: { $regex: filters.location, $options: 'i' } },
          { postcode: { $regex: filters.location, $options: 'i' } },
        ];
      }

      // Filter by availability
      if (filters.availability) {
        query.availability = { $regex: filters.availability, $options: 'i' };
      }

      return await this.subcontractorModel
        .find(query)
        .select('-password -resetToken -resetTokenExpires')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch subcontractors',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSubcontractorById(id: string): Promise<Subcontractor | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException('Invalid subcontractor ID', HttpStatus.BAD_REQUEST);
      }

      return await this.subcontractorModel
        .findById(id)
        .select('-password -resetToken -resetTokenExpires')
        .exec();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch subcontractor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
