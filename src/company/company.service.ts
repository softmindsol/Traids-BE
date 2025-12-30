import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './company.schema';
import { SignUpCompanyDto } from './dto/signup-company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpCompanyDto: SignUpCompanyDto): Promise<Company> {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(signUpCompanyDto.password, 10);

    const newCompany = new this.companyModel({
      ...signUpCompanyDto,
      password: hashedPassword,
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
