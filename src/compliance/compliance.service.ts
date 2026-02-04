import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Compliance, ComplianceDocument } from './schema/compliance.schema';
import { EmailService } from '../common/service/email.service';

@Injectable()
export class ComplianceService {
    constructor(
        @InjectModel(Compliance.name) private complianceModel: Model<ComplianceDocument>,
        private emailService: EmailService,
    ) { }

    async createCompliance(
        projectName: string,
        projectId: string,
    ): Promise<ComplianceDocument> {
        try {
            const compliance = new this.complianceModel({
                name: projectName,
                project: new Types.ObjectId(projectId),
                RAMS: [],
                permits: [],
                reports: [],
                incidents: [],
                drawings: [],
            });

            return await compliance.save();
        } catch (error) {
            throw new HttpException(
                'Failed to create compliance record',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getComplianceByProject(projectId: string): Promise<ComplianceDocument> {
        try {
            const compliance = await this.complianceModel
                .findOne({ project: new Types.ObjectId(projectId) })
                .populate('project')
                .exec();

            if (!compliance) {
                throw new HttpException('Compliance record not found', HttpStatus.NOT_FOUND);
            }

            return compliance;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to fetch compliance record',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getAllCompliances(): Promise<ComplianceDocument[]> {
        try {
            return await this.complianceModel
                .find()
                .populate('project')
                .sort({ createdAt: -1 })
                .exec();
        } catch (error) {
            throw new HttpException(
                'Failed to fetch compliance records',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getComplianceById(complianceId: string): Promise<ComplianceDocument> {
        try {
            const compliance = await this.complianceModel
                .findById(complianceId)
                .populate({
                    path: 'project',
                    populate: {
                        path: 'company',
                    }
                })
                .exec();

            if (!compliance) {
                throw new HttpException('Compliance record not found', HttpStatus.NOT_FOUND);
            }

            return compliance;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to fetch compliance record',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getCompliancesByCompany(companyId: string): Promise<ComplianceDocument[]> {
        try {
            return await this.complianceModel
                .find()
                .populate({
                    path: 'project',
                    match: { company: new Types.ObjectId(companyId) }
                })
                .exec()
                .then(compliances => compliances.filter(c => c.project !== null));
        } catch (error) {
            throw new HttpException(
                'Failed to fetch compliance records',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async updateComplianceFiles(
        complianceId: string,
        fileType: 'RAMS' | 'permits' | 'reports' | 'incidents' | 'drawings',
        fileUrls: string[],
    ): Promise<ComplianceDocument> {
        try {
            const compliance = await this.complianceModel.findById(complianceId);

            if (!compliance) {
                throw new HttpException('Compliance record not found', HttpStatus.NOT_FOUND);
            }

            // Add new file URLs to the existing array
            compliance[fileType].push(...fileUrls);

            return await compliance.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to update compliance files',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async deleteComplianceFile(
        complianceId: string,
        fileType: 'RAMS' | 'permits' | 'reports' | 'incidents' | 'drawings',
        fileUrl: string,
    ): Promise<ComplianceDocument> {
        try {
            const compliance = await this.complianceModel.findById(complianceId);

            if (!compliance) {
                throw new HttpException('Compliance record not found', HttpStatus.NOT_FOUND);
            }

            // Remove the file URL from the array
            compliance[fileType] = compliance[fileType].filter(url => url !== fileUrl);

            return await compliance.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to delete compliance file',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async shareCompliance(
        complianceId: string,
        recipientEmail: string,
        companyName: string,
    ): Promise<void> {
        try {
            const compliance = await this.complianceModel
                .findById(complianceId)
                .populate('project')
                .exec();

            if (!compliance) {
                throw new HttpException('Compliance record not found', HttpStatus.NOT_FOUND);
            }

            const project = compliance.project as any;
            const projectName = project.jobTitle || compliance.name;

            // Send email with all compliance files
            await this.emailService.sendComplianceEmail(
                recipientEmail,
                projectName,
                companyName,
                {
                    RAMS: compliance.RAMS,
                    permits: compliance.permits,
                    reports: compliance.reports,
                    incidents: compliance.incidents,
                    drawings: compliance.drawings,
                },
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to share compliance',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
