import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subcontractor', required: true })
  subcontractor: Types.ObjectId;

  @Prop()
  lastMessage: string;

  @Prop()
  lastMessageAt: Date;

  @Prop({ default: 0 })
  unreadCountCompany: number;

  @Prop({ default: 0 })
  unreadCountSubcontractor: number;
}

export type ConversationDocument = Conversation & Document;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
