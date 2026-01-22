import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OfferDocument = HydratedDocument<Offer>;

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Schema({ timestamps: true })
export class Offer {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  job: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subcontractor', required: true })
  subcontractor: Types.ObjectId;

  @Prop({ required: true, enum: OfferStatus, default: OfferStatus.PENDING })
  status: OfferStatus;

  @Prop({ default: Date.now })
  sentAt: Date;

  @Prop()
  respondedAt?: Date;

  @Prop()
  expiresAt?: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
