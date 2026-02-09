import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schema/notification.schema';

export interface CreateNotificationDto {
    type: string;
    title: string;
    message: string;
    senderId: string;
    senderType: 'company' | 'subcontractor';
    senderName: string;
    receiverId: string;
    receiverType: 'company' | 'subcontractor';
    relatedEntityId?: string;
    relatedEntityType?: 'job' | 'offer' | 'application' | 'message' | 'compliance';
    data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<NotificationDocument>,
    ) { }

    /**
     * Create a new notification
     */
    async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
        try {
            const notification = new this.notificationModel({
                type: dto.type,
                title: dto.title,
                message: dto.message,
                senderId: new Types.ObjectId(dto.senderId),
                senderType: dto.senderType,
                senderName: dto.senderName,
                receiverId: new Types.ObjectId(dto.receiverId),
                receiverType: dto.receiverType,
                relatedEntityId: dto.relatedEntityId ? new Types.ObjectId(dto.relatedEntityId) : undefined,
                relatedEntityType: dto.relatedEntityType,
                data: dto.data || {},
                isRead: false,
            });

            return await notification.save();
        } catch (error) {
            throw new HttpException(
                'Failed to create notification',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get all notifications for a user with pagination
     */
    async getNotificationsByUser(
        userId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ notifications: NotificationDocument[]; total: number; page: number; totalPages: number }> {
        try {
            const skip = (page - 1) * limit;

            const [notifications, total] = await Promise.all([
                this.notificationModel
                    .find({ receiverId: new Types.ObjectId(userId) })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.notificationModel.countDocuments({ receiverId: new Types.ObjectId(userId) }),
            ]);

            return {
                notifications,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            throw new HttpException(
                'Failed to fetch notifications',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get unread notifications for a user
     */
    async getUnreadNotifications(userId: string): Promise<NotificationDocument[]> {
        try {
            return await this.notificationModel
                .find({
                    receiverId: new Types.ObjectId(userId),
                    isRead: false,
                })
                .sort({ createdAt: -1 })
                .exec();
        } catch (error) {
            throw new HttpException(
                'Failed to fetch unread notifications',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            return await this.notificationModel.countDocuments({
                receiverId: new Types.ObjectId(userId),
                isRead: false,
            });
        } catch (error) {
            throw new HttpException(
                'Failed to get unread count',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
        try {
            const notification = await this.notificationModel.findOneAndUpdate(
                {
                    _id: new Types.ObjectId(notificationId),
                    receiverId: new Types.ObjectId(userId),
                },
                {
                    isRead: true,
                    readAt: new Date(),
                },
                { new: true },
            );

            if (!notification) {
                throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
            }

            return notification;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to mark notification as read',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
        try {
            const result = await this.notificationModel.updateMany(
                {
                    receiverId: new Types.ObjectId(userId),
                    isRead: false,
                },
                {
                    isRead: true,
                    readAt: new Date(),
                },
            );

            return { modifiedCount: result.modifiedCount };
        } catch (error) {
            throw new HttpException(
                'Failed to mark all notifications as read',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        try {
            const result = await this.notificationModel.deleteOne({
                _id: new Types.ObjectId(notificationId),
                receiverId: new Types.ObjectId(userId),
            });

            if (result.deletedCount === 0) {
                throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to delete notification',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
