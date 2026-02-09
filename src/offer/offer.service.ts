import { Injectable, HttpException, HttpStatus, ConsoleLogger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument, OfferStatus } from './schema/offer.schema';
import { Job, JobDocument } from '../job/schema/job.schema';
import { Subcontractor, SubcontractorDocument } from '../subcontractor/schema/subcontractor.schema';
import { Company, CompanyDocument } from '../company/schema/company.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { S3UploadService } from '../common/service/s3-upload.service';
import { SubcontractorSocketService } from '../socket/subcontractorSocket.service';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Subcontractor.name) private subcontractorModel: Model<SubcontractorDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private s3UploadService: S3UploadService,
    private subcontractorSocketService: SubcontractorSocketService,
  ) { }

  async sendOffer(
    createOfferDto: CreateOfferDto,
    companyId: string,
    files?: Express.Multer.File[],
  ): Promise<Offer> {
    try {
      // Validate subcontractor exists
      if (!Types.ObjectId.isValid(createOfferDto.subcontractorId)) {
        throw new HttpException('Invalid subcontractor ID', HttpStatus.BAD_REQUEST);
      }

      const subcontractor = await this.subcontractorModel
        .findById(createOfferDto.subcontractorId)
        .exec();
      if (!subcontractor) {
        throw new HttpException('Subcontractor not found', HttpStatus.NOT_FOUND);
      }

      // Upload documents to S3 if provided
      let documentUrls: string[] = [];
      if (files && files.length > 0) {
        documentUrls = await this.s3UploadService.uploadMultipleFiles(
          files,
          'jobs/documents',
        );
      }

      // Step 1: Create a new Job first
      const newJob = new this.jobModel({
        company: new Types.ObjectId(companyId),
        jobTitle: createOfferDto.jobTitle,
        trade: createOfferDto.trade,
        description: createOfferDto.description,
        siteAddress: createOfferDto.siteAddress,
        timelineStartDate: new Date(createOfferDto.timelineStartDate),
        timelineEndDate: new Date(createOfferDto.timelineEndDate),
        typeOfJob: 'offer',
        hourlyRate: createOfferDto.hourlyRate,
        projectDocuments: documentUrls,
      });

      const savedJob = await newJob.save();


      // Step 3: Create the Offer with the new Job ID
      const offer = new this.offerModel({
        job: savedJob._id,
        company: new Types.ObjectId(companyId),
        subcontractor: new Types.ObjectId(createOfferDto.subcontractorId),
        status: OfferStatus.PENDING,
        sentAt: new Date(),
        expiresAt: createOfferDto.expiresAt ? new Date(createOfferDto.expiresAt) : undefined,
      });

      const savedOffer = await offer.save();

      // Return populated offer
      const populatedOffer = await this.offerModel
        .findById(savedOffer._id)
        .populate('job')
        .populate('company', 'companyName workEmail phoneNumber')
        .populate('subcontractor', 'fullName email primaryTrade hourlyRate')
        .exec();

      if (!populatedOffer) {
        throw new HttpException('Failed to retrieve created offer', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Get company details for notification
      const company = await this.companyModel.findById(companyId).exec();

      // Send real-time notification to subcontractor
      this.subcontractorSocketService.notifyOfferReceived(createOfferDto.subcontractorId, {
        offerId: savedOffer._id.toString(),
        jobTitle: createOfferDto.jobTitle,
        companyName: company?.companyName || 'A company',
        companyId: companyId,
        hourlyRate: createOfferDto.hourlyRate,
      });

      return populatedOffer;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to send offer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOffersByCompany(companyId: string): Promise<Offer[]> {
    return await this.offerModel
      .find({ company: new Types.ObjectId(companyId) })
      .populate('job')
      .populate('subcontractor', 'fullName email primaryTrade hourlyRate profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOffersBySubcontractor(subcontractorId: string): Promise<Offer[]> {
    return await this.offerModel
      .find({ subcontractor: new Types.ObjectId(subcontractorId) })
      .populate('job')
      .populate('company', 'companyName workEmail phoneNumber headOfficeAddress')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOffersForJob(jobId: string): Promise<Offer[]> {
    return await this.offerModel
      .find({ job: new Types.ObjectId(jobId) })
      .populate('subcontractor', 'fullName email primaryTrade hourlyRate profileImage')
      .sort({ sentAt: -1 })
      .exec();
  }

  async getAcceptedOffer(jobId: string): Promise<Offer | null> {
    return await this.offerModel
      .findOne({ job: new Types.ObjectId(jobId), status: OfferStatus.ACCEPTED })
      .populate('subcontractor', 'fullName email primaryTrade hourlyRate profileImage')
      .exec();
  }
}
