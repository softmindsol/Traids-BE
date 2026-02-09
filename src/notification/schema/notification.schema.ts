import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true })
    type: string; // Event type (e.g., 'offerReceived', 'applicationAccepted')

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    // Sender details
    @Prop({ type: Types.ObjectId, required: true })
    senderId: Types.ObjectId;

    @Prop({ required: true, enum: ['company', 'subcontractor'] })
    senderType: string;

    @Prop({ required: true })
    senderName: string;

    // Receiver details
    @Prop({ type: Types.ObjectId, required: true, index: true })
    receiverId: Types.ObjectId;

    @Prop({ required: true, enum: ['company', 'subcontractor'] })
    receiverType: string;

    // Related entity
    @Prop({ type: Types.ObjectId })
    relatedEntityId: Types.ObjectId;

    @Prop({ enum: ['job', 'offer', 'application', 'message', 'compliance'] })
    relatedEntityType: string;

    // Metadata
    @Prop({ type: Object })
    data: Record<string, any>;

    @Prop({ default: false, index: true })
    isRead: boolean;

    @Prop()
    readAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create compound index for efficient querying
NotificationSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });
