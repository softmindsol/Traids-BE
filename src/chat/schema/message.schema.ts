import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  sender: Types.ObjectId;

  @Prop({ required: true, enum: ['company', 'subcontractor'] })
  senderType: string;

  @Prop({ required: true })
  content: string;

  @Prop([String])
  attachments: string[];

  @Prop()
  readAt: Date;
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);
