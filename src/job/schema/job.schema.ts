import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JobDocument = HydratedDocument<Job>;

export enum Trade {
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  CARPENTER = 'carpenter',
  MASONRY = 'masonry',
}

export enum typeOfJob {
  offer = 'offer',
  request = 'request',
}

@Schema({ timestamps: true })
export class Job {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subcontractor', required: false })
  assignedTo?: Types.ObjectId;

  @Prop({ required: true, enum: typeOfJob })
  typeOfJob: typeOfJob;

  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true, enum: Trade })
  trade: Trade;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  siteAddress: string;

  @Prop({ required: true })
  timelineStartDate: Date;

  @Prop({ required: true })
  timelineEndDate: Date;

  @Prop({ required: true })
  hourlyRate: number;

  @Prop({ type: [String], default: [] })
  projectDocuments: string[];
}

export const JobSchema = SchemaFactory.createForClass(Job);
