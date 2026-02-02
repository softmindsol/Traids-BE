import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class CompanySocketService {
    private readonly logger = new Logger(CompanySocketService.name);

    constructor(private socketGateway: SocketGateway) { }

    /**
     * Notify company about new job application
     */
    notifyNewJobApplication(
        companyId: string,
        applicationData: {
            applicationId: string;
            jobId: string;
            subcontractorName: string;
            appliedAt: Date;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${companyId}`)
            .emit('newJobApplication', {
                applicationId: applicationData.applicationId,
                jobId: applicationData.jobId,
                subcontractorName: applicationData.subcontractorName,
                appliedAt: applicationData.appliedAt,
            });

        this.logger.log(`New job application notification sent to company ${companyId}`);
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
        this.socketGateway.getServer()
            .to(`user:${companyId}`)
            .emit('offerAccepted', {
                offerId: offerData.offerId,
                jobTitle: offerData.jobTitle,
                subcontractorName: offerData.subcontractorName,
            });

        this.logger.log(`Offer accepted notification sent to company ${companyId}`);
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
        this.socketGateway.getServer()
            .to(`user:${companyId}`)
            .emit('offerRejected', {
                offerId: offerData.offerId,
                jobTitle: offerData.jobTitle,
                subcontractorName: offerData.subcontractorName,
            });

        this.logger.log(`Offer rejected notification sent to company ${companyId}`);
    }

    /**
     * Notify company about new message
     */
    notifyNewMessage(
        companyId: string,
        messageData: {
            conversationId: string;
            senderId: string;
            senderName: string;
            preview: string;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${companyId}`)
            .emit('newMessage', {
                conversationId: messageData.conversationId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                preview: messageData.preview,
            });

        this.logger.log(`New message notification sent to company ${companyId}`);
    }

    /**
     * Notify company about job status update
     */
    notifyJobStatusUpdate(
        companyId: string,
        jobData: {
            jobId: string;
            jobTitle: string;
            status: string;
        },
    ): void {
        this.socketGateway.getServer()
            .to(`user:${companyId}`)
            .emit('jobStatusUpdate', {
                jobId: jobData.jobId,
                jobTitle: jobData.jobTitle,
                status: jobData.status,
            });

        this.logger.log(`Job status update notification sent to company ${companyId}`);
    }

    /**
     * Check if company is currently online
     */
    isCompanyOnline(companyId: string): boolean {
        return this.socketGateway.isUserOnline(companyId);
    }
}
