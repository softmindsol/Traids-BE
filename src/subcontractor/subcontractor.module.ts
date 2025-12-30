import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Subcontractor, SubcontractorSchema } from './schema/subcontractor.schema';
import { SubcontractorService } from './subcontractor.service';
import { SubcontractorController } from './subcontractor.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subcontractor.name, schema: SubcontractorSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SubcontractorController],
  providers: [SubcontractorService],
  exports: [SubcontractorService],
})
export class SubcontractorModule {}
