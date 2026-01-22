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

  constructor(private socketGateway: SocketGateway) {}

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: NotificationPayload): void {
    console.log('Sending notification to user:', userId, notification);
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

  // ============================================
  // Convenience methods for common notifications
  // ============================================

  /**
   * Notify subcontractor about new offer
   */
  notifyOfferReceived(
    subcontractorId: string,
    offerData: {
      offerId: string;
      jobTitle: string;
      companyName: string;
      hourlyRate: number;
    },
  ): void {
    this.sendToUser(subcontractorId, {
      type: NotificationType.OFFER_RECEIVED,
      title: 'New Job Offer',
      message: `You received a new offer for "${offerData.jobTitle}" from ${offerData.companyName}`,
      data: offerData,
    });
  }

  /**
   * Notify company that offer was accepted
   */
  notifyOfferAccepted(
    companyId: string,
    offerData: {
      offerId: string;
      jobTitle: string;
      subcontractorName: string;
    },
  ): void {
    this.sendToUser(companyId, {
      type: NotificationType.OFFER_ACCEPTED,
      title: 'Offer Accepted',
      message: `${offerData.subcontractorName} accepted your offer for "${offerData.jobTitle}"`,
      data: offerData,
    });
  }

  /**
   * Notify company that offer was rejected
   */
  notifyOfferRejected(
    companyId: string,
    offerData: {
      offerId: string;
      jobTitle: string;
      subcontractorName: string;
    },
  ): void {
    this.sendToUser(companyId, {
      type: NotificationType.OFFER_REJECTED,
      title: 'Offer Rejected',
      message: `${offerData.subcontractorName} rejected your offer for "${offerData.jobTitle}"`,
      data: offerData,
    });
  }

  /**
   * Notify about job assignment
   */
  notifyJobAssigned(
    userId: string,
    jobData: {
      jobId: string;
      jobTitle: string;
    },
  ): void {
    this.sendToUser(userId, {
      type: NotificationType.JOB_ASSIGNED,
      title: 'Job Assigned',
      message: `You have been assigned to "${jobData.jobTitle}"`,
      data: jobData,
    });
  }

  /**
   * Notify about new message
   */
  notifyMessageReceived(
    userId: string,
    messageData: {
      senderId: string;
      senderName: string;
      preview: string;
      conversationId?: string;
    },
  ): void {
    this.sendToUser(userId, {
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'New Message',
      message: `${messageData.senderName}: ${messageData.preview}`,
      data: messageData,
    });
  }
}
