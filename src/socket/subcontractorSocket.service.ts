import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SubcontractorSocketService {
    private readonly logger = new Logger(SubcontractorSocketService.name);

    constructor(private socketGateway: SocketGateway) { }

    /**
     * Notify subcontractor that application was accepted
     */
    notifyApplicationAccepted(
        subcontractorId: string,
        applicationData: {
            applicationId: string;
            jobId: string;
            message?: string;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('applicationAccepted', {
                applicationId: applicationData.applicationId,
                jobId: applicationData.jobId,
                message: applicationData.message,
            });

        this.logger.log(`Application accepted notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor that application was rejected
     */
    notifyApplicationRejected(
        subcontractorId: string,
        applicationData: {
            applicationId: string;
            jobId: string;
            message?: string;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('applicationRejected', {
                applicationId: applicationData.applicationId,
                jobId: applicationData.jobId,
                message: applicationData.message,
            });

        this.logger.log(`Application rejected notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor about new job offer
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
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('offerReceived', {
                offerId: offerData.offerId,
                jobTitle: offerData.jobTitle,
                companyName: offerData.companyName,
                hourlyRate: offerData.hourlyRate,
            });

        this.logger.log(`Offer received notification sent to subcontractor ${subcontractorId}`);
    }

    /**
     * Notify subcontractor about new message
     */
    notifyNewMessage(
        subcontractorId: string,
        messageData: {
            conversationId: string;
            senderId: string;
            senderName: string;
            preview: string;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${subcontractorId}`)
            .emit('newMessage', {
                conversationId: messageData.conversationId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                preview: messageData.preview,
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
