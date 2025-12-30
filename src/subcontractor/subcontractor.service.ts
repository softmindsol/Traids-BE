import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Subcontractor, SubcontractorDocument } from './subcontractor.schema';
import { SignUpSubcontractorDto } from './dto/signup-subcontractor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SubcontractorService {
  constructor(
    @InjectModel(Subcontractor.name)
    private subcontractorModel: Model<SubcontractorDocument>,
    private jwtService: JwtService,
  ) {}

  async signUp(
    signUpSubcontractorDto: SignUpSubcontractorDto,
  ): Promise<Subcontractor> {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(
      signUpSubcontractorDto.password,
      10,
    );

    const newSubcontractor = new this.subcontractorModel({
      ...signUpSubcontractorDto,
      password: hashedPassword,
    });

    return newSubcontractor.save();
  }

  async findByEmail(email: string): Promise<Subcontractor | null> {
    return this.subcontractorModel.findOne({ email: email }).exec();
  }
}
