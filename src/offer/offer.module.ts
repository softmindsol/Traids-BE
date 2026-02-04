import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Offer, OfferSchema } from './schema/offer.schema';
import { Job, JobSchema } from '../job/schema/job.schema';
import { Subcontractor, SubcontractorSchema } from '../subcontractor/schema/subcontractor.schema';
import { Company, CompanySchema } from '../company/schema/company.schema';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Job.name, schema: JobSchema },
      { name: Subcontractor.name, schema: SubcontractorSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    CommonModule,
  ],
  controllers: [OfferController],
  providers: [OfferService],
  exports: [OfferService],
})
export class OfferModule { }
