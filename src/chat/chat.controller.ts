import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { SendFirstMessageDto } from './dto/send-first-message.dto';
import { SendJobDto } from './dto/send-job.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { S3UploadService } from '../common/service/s3-upload.service';
// Update the path below to the correct location of jwt-auth.guard.ts
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly s3UploadService: S3UploadService,
  ) { }

  @Post('send-first')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'attachments', maxCount: 10 },
  ]))
  async sendFirstMessage(
    @Req() req,
    @Body() body: SendFirstMessageDto,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] },
  ) {
    const { companyId, subcontractorId, content } = body;

    // Validation is now handled in ChatService.findOrCreateConversation
    let attachmentUrls: string[] = [];
    if (files && files.attachments && files.attachments.length > 0) {
      // Upload files to S3 and get URLs
      attachmentUrls = await this.s3UploadService.uploadMultipleFiles(files.attachments, 'chat');
    }

    // Validate at least one of content or attachments is provided
    if (!content && attachmentUrls.length === 0) {
      return {
        success: false,
        message: 'Either message content or attachments must be provided',
      };
    }

    // Find or create conversation
    const conversation = await this.chatService.findOrCreateConversation(companyId, subcontractorId);
    // Sender info
    const userId = req.user.sub;
    const userType = req.user.userType;
    // Send message
    const message = await this.chatService.sendMessage(
      conversation._id.toString(),
      userId,
      userType,
      content || '',
      attachmentUrls,
    );
    return { conversation, message };
  }

  @Post('send')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'attachments', maxCount: 10 },
  ]))
  async sendMessage(
    @Req() req,
    @Body() body: SendMessageDto,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] },
  ) {
    const userId = req.user.sub;
    const userType = req.user.userType;
    const { conversationId, content } = body;
    let attachmentUrls: string[] = [];
    if (files && files.attachments && files.attachments.length > 0) {
      attachmentUrls = await this.s3UploadService.uploadMultipleFiles(files.attachments, 'chat');
    } else if (body.attachments) {
      attachmentUrls = body.attachments;
    }

    // Validate at least one of content or attachments is provided
    if (!content && attachmentUrls.length === 0) {
      return {
        success: false,
        message: 'Either message content or attachments must be provided',
      };
    }

    return this.chatService.sendMessage(
      conversationId,
      userId,
      userType,
      content || '',
      attachmentUrls,
    );
  }

  @Post('read/:conversationId')
  async markAsRead(@Req() req, @Param('conversationId') conversationId: string) {
    const userType = req.user.userType;
    try {
      await this.chatService.markMessagesAsRead(conversationId, userType);
      return { success: true, message: 'Messages marked as read.' };
    } catch (error) {
      return { success: false, message: error?.message || 'Failed to mark messages as read.' };
    }
  }

  @Get('conversations')
  async getConversations(@Req() req) {
    const userId = req.user.sub;
    const userType = req.user.userType;
    return this.chatService.getConversationsForUser(userId, userType);
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string, @Query('limit') limit = 50, @Query('skip') skip = 0) {
    return this.chatService.getMessages(conversationId, Number(limit), Number(skip));
  }

  @Post('send-job')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async sendJob(@Req() req, @Body() body: SendJobDto) {
    const companyId = req.user.sub;
    const { subcontractorId, jobId } = body;

    const message = await this.chatService.sendJobMessage(
      companyId,
      subcontractorId,
      jobId,
    );

    return {
      success: true,
      message: 'Job sent successfully',
      data: message,
    };
  }
}
