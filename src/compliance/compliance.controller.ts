import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
    UseInterceptors,
    UploadedFiles,
    HttpException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { S3UploadService } from '../common/service/s3-upload.service';

@Controller('compliance')
export class ComplianceController {
    constructor(
        private readonly complianceService: ComplianceService,
        private readonly s3UploadService: S3UploadService,
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getAllCompliances(@Request() req) {
        // Only return compliances for jobs owned by the requesting company
        const compliances = await this.complianceService.getCompliancesByCompany(req.user.sub);

        return {
            message: 'Compliance records retrieved successfully',
            count: compliances.length,
            data: compliances,
        };
    }

    @Get('project/:projectId')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getComplianceByProject(@Param('projectId') projectId: string, @Request() req) {
        const compliance = await this.complianceService.getComplianceByProject(projectId);

        // Verify that the requesting user owns the project
        const project = compliance.project as any;
        const companyId = project.company?._id ? project.company._id.toString() : project.company?.toString();

        if (companyId !== req.user.sub) {
            throw new HttpException(
                'You do not have permission to access this compliance record',
                HttpStatus.FORBIDDEN,
            );
        }

        return {
            message: 'Compliance record retrieved successfully',
            data: compliance,
        };
    }

    @Post(':complianceId/upload/:fileType')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadComplianceFiles(
        @Param('complianceId') complianceId: string,
        @Param('fileType') fileType: 'RAMS' | 'permits' | 'reports' | 'incidents' | 'drawings',
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
    ) {
        // Verify ownership before allowing upload
        const compliance = await this.complianceService.getComplianceById(complianceId);
        const project = compliance.project as any;
        const companyId = project.company?._id ? project.company._id.toString() : project.company?.toString();

        if (companyId !== req.user.sub) {
            throw new HttpException(
                'You do not have permission to upload files to this compliance record',
                HttpStatus.FORBIDDEN,
            );
        }

        // Upload files to S3
        const fileUrls = await this.s3UploadService.uploadMultipleFiles(
            files,
            `compliance/${fileType.toLowerCase()}`,
        );

        // Update compliance record with new file URLs
        const updatedCompliance = await this.complianceService.updateComplianceFiles(
            complianceId,
            fileType,
            fileUrls,
        );

        return {
            message: `${fileType} files uploaded successfully`,
            data: updatedCompliance,
        };
    }

    @Delete(':complianceId/:fileType')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @HttpCode(HttpStatus.OK)
    async deleteComplianceFile(
        @Param('complianceId') complianceId: string,
        @Param('fileType') fileType: 'RAMS' | 'permits' | 'reports' | 'incidents' | 'drawings',
        @Body('fileUrl') fileUrl: string,
        @Request() req,
    ) {
        // Verify ownership before allowing deletion
        const compliance = await this.complianceService.getComplianceById(complianceId);
        const project = compliance.project as any;
        const companyId = project.company?._id ? project.company._id.toString() : project.company?.toString();

        if (companyId !== req.user.sub) {
            throw new HttpException(
                'You do not have permission to delete files from this compliance record',
                HttpStatus.FORBIDDEN,
            );
        }

        const updatedCompliance = await this.complianceService.deleteComplianceFile(
            complianceId,
            fileType,
            fileUrl,
        );

        return {
            message: `${fileType} file deleted successfully`,
            data: updatedCompliance,
        };
    }

    @Post(':complianceId/share')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @HttpCode(HttpStatus.OK)
    async shareCompliance(
        @Param('complianceId') complianceId: string,
        @Body() shareDto: { email: string },
        @Request() req,
    ) {
        // Verify ownership before allowing sharing
        const compliance = await this.complianceService.getComplianceById(complianceId);
        const project = compliance.project as any;
        const companyId = project.company?._id ? project.company._id.toString() : project.company?.toString();

        if (companyId !== req.user.sub) {
            throw new HttpException(
                'You do not have permission to share this compliance record',
                HttpStatus.FORBIDDEN,
            );
        }

        // Get company name from the populated project data
        const companyName = project.company?.companyName || 'Traids Company';

        // Share compliance via email
        await this.complianceService.shareCompliance(
            complianceId,
            shareDto.email,
            companyName,
        );

        return {
            message: 'Compliance shared successfully',
            recipient: shareDto.email,
        };
    }
}
