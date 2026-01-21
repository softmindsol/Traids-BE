import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Subcontractor, SubcontractorDocument } from './schema/subcontractor.schema';
import { SignUpSubcontractorDto } from './dto/signup-subcontractor.dto';
import { S3UploadService } from '../common/service/s3-upload.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SubcontractorService {
  constructor(
    @InjectModel(Subcontractor.name)
    private subcontractorModel: Model<SubcontractorDocument>,
    private jwtService: JwtService,
    private s3UploadService: S3UploadService,
  ) {}

  async signUp(
    signUpSubcontractorDto: SignUpSubcontractorDto,
    files?: {
      insuranceDocuments?: Express.Multer.File[];
      ticketsDocuments?: Express.Multer.File[];
      certificationDocuments?: Express.Multer.File[];
      profileImage?: Express.Multer.File[];
      workExamples?: Express.Multer.File[];
    },
  ): Promise<Subcontractor> {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(
      signUpSubcontractorDto.password,
      10,
    );

    // Upload files to S3 and get URLs
    let insuranceData: { documents: string[]; expiresAt: any } = { documents: [], expiresAt: null };
    let ticketsData: { documents: string[]; expiresAt: any } = { documents: [], expiresAt: null };
    let certificationData: { documents: string[]; expiresAt: any } = { documents: [], expiresAt: null };
    let profileImageUrl: string | undefined;
    let workExamplesUrls: string[] = [];

    if (files) {
      // Upload insurance documents
      if (files.insuranceDocuments?.length) {
        const insuranceUrls = await this.s3UploadService.uploadMultipleFiles(
          files.insuranceDocuments,
          'subcontractors/insurance',
        );
        insuranceData = {
          documents: insuranceUrls,
          expiresAt: signUpSubcontractorDto.insurance?.expiresAt || null,
        };
      }

      // Upload tickets documents
      if (files.ticketsDocuments?.length) {
        const ticketsUrls = await this.s3UploadService.uploadMultipleFiles(
          files.ticketsDocuments,
          'subcontractors/tickets',
        );
        ticketsData = {
          documents: ticketsUrls,
          expiresAt: signUpSubcontractorDto.tickets?.expiresAt || null,
        };
      }

      // Upload certification documents
      if (files.certificationDocuments?.length) {
        const certificationUrls = await this.s3UploadService.uploadMultipleFiles(
          files.certificationDocuments,
          'subcontractors/certification',
        );
        certificationData = {
          documents: certificationUrls,
          expiresAt: signUpSubcontractorDto.certification?.expiresAt || null,
        };
      }

      // Upload profile image
      if (files.profileImage?.length) {
        profileImageUrl = await this.s3UploadService.uploadFile(
          files.profileImage[0],
          'subcontractors/profile-images',
        );
      }

      // Upload work examples
      if (files.workExamples?.length) {
        workExamplesUrls = await this.s3UploadService.uploadMultipleFiles(
          files.workExamples,
          'subcontractors/work-examples',
        );
      }
    }

    const newSubcontractor = new this.subcontractorModel({
      ...signUpSubcontractorDto,
      password: hashedPassword,
      insurance: insuranceData,
      tickets: ticketsData,
      certification: certificationData,
      profileImage: profileImageUrl || signUpSubcontractorDto.profileImage,
      workExamples: workExamplesUrls.length > 0 ? workExamplesUrls : signUpSubcontractorDto.workExamples,
    });

    return newSubcontractor.save();
  }

  async findByEmail(email: string): Promise<Subcontractor | null> {
    return this.subcontractorModel.findOne({ email: email }).exec();
  }
}
