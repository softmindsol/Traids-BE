import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

// Define notification types for type safety
export enum NotificationType {
  // Offer notifications
  OFFER_RECEIVED = 'offer:received',
  OFFER_ACCEPTED = 'offer:accepted',
  OFFER_REJECTED = 'offer:rejected',
  OFFER_WITHDRAWN = 'offer:withdrawn',
  OFFER_EXPIRED = 'offer:expired',

  // Job notifications
  JOB_CREATED = 'job:created',
  JOB_UPDATED = 'job:updated',
  JOB_ASSIGNED = 'job:assigned',
  JOB_COMPLETED = 'job:completed',

  // Chat notifications
  MESSAGE_RECEIVED = 'message:received',

  // General notifications
  NOTIFICATION = 'notification',
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp?: Date;
}

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);

  constructor(private socketGateway: SocketGateway) { }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: NotificationPayload): void {
    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.socketGateway.getServer().to(`user:${userId}`).emit(notification.type, payload);
    this.logger.log(`Notification sent to user ${userId}: ${notification.type}`);
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: string[], notification: NotificationPayload): void {
    userIds.forEach((userId) => this.sendToUser(userId, notification));
  }

  /**
   * Send notification to all users of a specific type (company/subcontractor)
   */
  sendToUserType(userType: 'company' | 'subcontractor', notification: NotificationPayload): void {
    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.socketGateway.getServer().to(`type:${userType}`).emit(notification.type, payload);
    this.logger.log(`Notification sent to all ${userType}s: ${notification.type}`);
  }

  /**
   * Send notification to a specific room
   */
  sendToRoom(room: string, notification: NotificationPayload): void {
    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.socketGateway.getServer().to(room).emit(notification.type, payload);
    this.logger.log(`Notification sent to room ${room}: ${notification.type}`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(notification: NotificationPayload): void {
    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };

    this.socketGateway.getServer().emit(notification.type, payload);
    this.logger.log(`Broadcast notification: ${notification.type}`);
  }

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.socketGateway.isUserOnline(userId);
  }

  /**
   * Get list of all online users
   */
  getOnlineUsers(): string[] {
    return this.socketGateway.getOnlineUsers();
  }
}
