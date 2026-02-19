import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SubcontractorSocketService {
    private readonly logger = new Logger(SubcontractorSocketService.name);

    constructor(
        private socketGateway: SocketGateway,
        private notificationService: NotificationService,
    ) { }

    /**
     * Notify subcontractor that application was accepted
     */
    async notifyApplicationAccepted(
        subcontractorId: string,
        applicationData: {
            applicationId: string;
            jobId: string;
            message?: string;
            companyId: string;
            companyName: string;
        },
    ): Promise<void> {
        // Emit socket event
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('applicationAccepted', {
                applicationId: applicationData.applicationId,
                jobId: applicationData.jobId,
                message: applicationData.message,
            });

        // Create notification in database
        await this.notificationService.createNotification({
            type: 'applicationAccepted',
            title: 'Application Accepted',
            message: applicationData.message || 'Your job application has been accepted',
            senderId: applicationData.companyId,
            senderType: 'company',
            senderName: applicationData.companyName,
            receiverId: subcontractorId,
            receiverType: 'subcontractor',
            relatedEntityId: applicationData.applicationId,
            relatedEntityType: 'application',
            data: { jobId: applicationData.jobId },
        });

        this.logger.log(`Application accepted notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor that application was rejected
     */
    async notifyApplicationRejected(
        subcontractorId: string,
        applicationData: {
            applicationId: string;
            jobId: string;
            message?: string;
            companyId: string;
            companyName: string;
        },
    ): Promise<void> {
        // Emit socket event
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('applicationRejected', {
                applicationId: applicationData.applicationId,
                jobId: applicationData.jobId,
                message: applicationData.message,
            });

        // Create notification in database
        await this.notificationService.createNotification({
            type: 'applicationRejected',
            title: 'Application Rejected',
            message: applicationData.message || 'Your job application has been rejected',
            senderId: applicationData.companyId,
            senderType: 'company',
            senderName: applicationData.companyName,
            receiverId: subcontractorId,
            receiverType: 'subcontractor',
            relatedEntityId: applicationData.applicationId,
            relatedEntityType: 'application',
            data: { jobId: applicationData.jobId },
        });

        this.logger.log(`Application rejected notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor about new job offer
     */
    async notifyOfferReceived(
        subcontractorId: string,
        offerData: {
            offerId: string;
            jobTitle: string;
            companyName: string;
            companyId: string;
            hourlyRate: number;
        },
    ): Promise<void> {
        // Emit socket event
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('offerReceived', {
                offerId: offerData.offerId,
                jobTitle: offerData.jobTitle,
                companyName: offerData.companyName,
                hourlyRate: offerData.hourlyRate,
            });

        // Create notification in database
        await this.notificationService.createNotification({
            type: 'offerReceived',
            title: 'New Job Offer',
            message: `${offerData.companyName} sent you an offer for ${offerData.jobTitle}`,
            senderId: offerData.companyId,
            senderType: 'company',
            senderName: offerData.companyName,
            receiverId: subcontractorId,
            receiverType: 'subcontractor',
            relatedEntityId: offerData.offerId,
            relatedEntityType: 'offer',
            data: {
                jobTitle: offerData.jobTitle,
                hourlyRate: offerData.hourlyRate,
            },
        });

        this.logger.log(`Offer received notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor about new message
     */
    async notifyNewMessage(
        subcontractorId: string,
        messageData: {
            conversationId: string;
            senderId: string;
            senderName: string;
            preview: string;
            messageId?: string;
        },
    ): Promise<void> {
        // Emit socket event
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('newMessage', {
                conversationId: messageData.conversationId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                preview: messageData.preview,
            });

        // Create notification in database
        await this.notificationService.createNotification({
            type: 'newMessage',
            title: 'New Message',
            message: `${messageData.senderName}: ${messageData.preview}`,
            senderId: messageData.senderId,
            senderType: 'company',
            senderName: messageData.senderName,
            receiverId: subcontractorId,
            receiverType: 'subcontractor',
            relatedEntityId: messageData.messageId,
            relatedEntityType: 'message',
            data: { conversationId: messageData.conversationId },
        });

        this.logger.log(`New message notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor about job assignment
     */
    notifyJobAssigned(
        subcontractorId: string,
        jobData: {
            jobId: string;
            jobTitle: string;
            companyName: string;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('jobAssigned', {
                jobId: jobData.jobId,
                jobTitle: jobData.jobTitle,
                companyName: jobData.companyName,
            });

        this.logger.log(`Job assigned notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Check if subcontractor is currently online
     */
    isSubcontractorOnline(subcontractorId: string): boolean {
        return this.socketGateway.isUserOnline(subcontractorId);
    }
}
