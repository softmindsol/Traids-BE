import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubcontractorDocument = HydratedDocument<Subcontractor>;

export enum PrimaryTrade {
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  CARPENTER = 'carpenter',
  MASONRY = 'masonry',
}

@Schema({ timestamps: true })
export class Subcontractor {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, enum: PrimaryTrade })
  primaryTrade: PrimaryTrade;

  @Prop()
  yearsOfExperience: number;

  @Prop({ required: true })
  postcode: string;

  @Prop({ required: true })
  cityLocation: string;

  @Prop({ type: [String], default: [] })
  cscsCards: string[];

  @Prop()
  profileImage: string;

  @Prop({ required: true })
  hourlyRate: number;

  @Prop()
  availability: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  professionalBio: string;

  @Prop({ type: [String], default: [] })
  workExamples: string[];

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires? : Date;
}

export const SubcontractorSchema = SchemaFactory.createForClass(Subcontractor);
