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
  ) { }

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

  async updateProfile(
    userId: string,
    updateDto: any,
    files?: {
      insuranceDocuments?: Express.Multer.File[];
      ticketsDocuments?: Express.Multer.File[];
      certificationDocuments?: Express.Multer.File[];
      profileImage?: Express.Multer.File[];
    },
  ): Promise<Subcontractor> {
    const subcontractor = await this.subcontractorModel.findById(userId);
    if (!subcontractor) {
      throw new Error('Subcontractor not found');
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (updateDto.fullName !== undefined) updateData.fullName = updateDto.fullName;
    if (updateDto.primaryTrade !== undefined) updateData.primaryTrade = updateDto.primaryTrade;
    if (updateDto.hourlyRate !== undefined) updateData.hourlyRate = updateDto.hourlyRate;
    if (updateDto.professionalBio !== undefined) updateData.professionalBio = updateDto.professionalBio;
    if (updateDto.availability !== undefined) updateData.availability = updateDto.availability;
    if (updateDto.postcode !== undefined) updateData.postcode = updateDto.postcode;
    if (updateDto.cityLocation !== undefined) updateData.cityLocation = updateDto.cityLocation;
    if (updateDto.phoneNumber !== undefined) updateData.phoneNumber = updateDto.phoneNumber;
    if (updateDto.yearsOfExperience !== undefined) updateData.yearsOfExperience = updateDto.yearsOfExperience;
    if (updateDto.jobAlerts !== undefined) updateData.jobAlerts = updateDto.jobAlerts;
    if (updateDto.timesheetReminders !== undefined) updateData.timesheetReminders = updateDto.timesheetReminders;

    // Handle password change
    if (updateDto.newPassword) {
      updateData.password = await bcrypt.hash(updateDto.newPassword, 10);
    }

    // Handle file uploads
    if (files) {
      // Upload and update profile image
      if (files.profileImage?.length) {
        updateData.profileImage = await this.s3UploadService.uploadFile(
          files.profileImage[0],
          'subcontractors/profile-images',
        );
      }

      // Upload and replace insurance documents
      if (files.insuranceDocuments?.length) {
        const newUrls = await this.s3UploadService.uploadMultipleFiles(
          files.insuranceDocuments,
          'subcontractors/insurance',
        );
        updateData.insurance = {
          documents: newUrls,
          expiresAt: updateDto.insurance?.expiresAt || subcontractor.insurance?.expiresAt || null,
        };
      } else if (updateDto.insurance) {
        updateData.insurance = {
          documents: updateDto.insurance.documents || subcontractor.insurance?.documents || [],
          expiresAt: updateDto.insurance.expiresAt || subcontractor.insurance?.expiresAt || null,
        };
      }

      // Upload and replace tickets documents
      if (files.ticketsDocuments?.length) {
        const newUrls = await this.s3UploadService.uploadMultipleFiles(
          files.ticketsDocuments,
          'subcontractors/tickets',
        );
        updateData.tickets = {
          documents: newUrls,
          expiresAt: updateDto.tickets?.expiresAt || subcontractor.tickets?.expiresAt || null,
        };
      } else if (updateDto.tickets) {
        updateData.tickets = {
          documents: updateDto.tickets.documents || subcontractor.tickets?.documents || [],
          expiresAt: updateDto.tickets.expiresAt || subcontractor.tickets?.expiresAt || null,
        };
      }

      // Upload and replace certification documents
      if (files.certificationDocuments?.length) {
        const newUrls = await this.s3UploadService.uploadMultipleFiles(
          files.certificationDocuments,
          'subcontractors/certification',
        );
        updateData.certification = {
          documents: newUrls,
          expiresAt: updateDto.certification?.expiresAt || subcontractor.certification?.expiresAt || null,
        };
      } else if (updateDto.certification) {
        updateData.certification = {
          documents: updateDto.certification.documents || subcontractor.certification?.documents || [],
          expiresAt: updateDto.certification.expiresAt || subcontractor.certification?.expiresAt || null,
        };
      }
    }

    const updated = await this.subcontractorModel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .select('-password -resetToken -resetTokenExpires')
      .exec();

    if (!updated) {
      throw new Error('Failed to update profile');
    }

    return updated;
  }
}
