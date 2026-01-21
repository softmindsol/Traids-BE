import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schema/company.schema';
import { SignUpCompanyDto } from './dto/signup-company.dto';
import { S3UploadService } from '../common/service/s3-upload.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private jwtService: JwtService,
    private s3UploadService: S3UploadService,
  ) {}

  async signUp(
    signUpCompanyDto: SignUpCompanyDto,
    files?: {
      companyDocuments?: Express.Multer.File[];
      insuranceCertificate?: Express.Multer.File[];
      healthAndSafetyPolicy?: Express.Multer.File[];
    },
  ): Promise<Company> {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(signUpCompanyDto.password, 10);

    // Upload files to S3 and get URLs
    let companyDocumentsUrls: string[] = [];
    let insuranceCertificateUrl: string | undefined;
    let healthAndSafetyPolicyUrl: string | undefined;

    if (files) {
      // Upload company documents
      if (files.companyDocuments?.length) {
        companyDocumentsUrls = await this.s3UploadService.uploadMultipleFiles(
          files.companyDocuments,
          'companies/documents',
        );
      }

      // Upload insurance certificate
      if (files.insuranceCertificate?.length) {
        insuranceCertificateUrl = await this.s3UploadService.uploadFile(
          files.insuranceCertificate[0],
          'companies/insurance',
        );
      }

      // Upload health and safety policy
      if (files.healthAndSafetyPolicy?.length) {
        healthAndSafetyPolicyUrl = await this.s3UploadService.uploadFile(
          files.healthAndSafetyPolicy[0],
          'companies/health-safety',
        );
      }
    }

    const newCompany = new this.companyModel({
      ...signUpCompanyDto,
      password: hashedPassword,
      companyDocuments: companyDocumentsUrls.length > 0 ? companyDocumentsUrls : signUpCompanyDto.companyDocuments,
      insuranceCertificate: insuranceCertificateUrl || signUpCompanyDto.insuranceCertificate,
      healthAndSafetyPolicy: healthAndSafetyPolicyUrl || signUpCompanyDto.healthAndSafetyPolicy,
    });

    return newCompany.save();
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.companyModel.findOne({ workEmail: email }).exec();
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Company | null> {
    return this.companyModel
      .findOne({ registrationNumber: registrationNumber })
      .exec();
  }
}
