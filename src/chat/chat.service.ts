import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CompanySocketService } from '../socket/companySocket.service';
import { SubcontractorSocketService } from '../socket/subcontractorSocket.service';
import { SocketGateway } from '../socket/socket.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schema/conversation.schema';
import { Message, MessageDocument } from './schema/message.schema';
import { Subcontractor, SubcontractorDocument } from '../subcontractor/schema/subcontractor.schema';
import { Company, CompanyDocument } from '../company/schema/company.schema';
import { Job, JobDocument } from '../job/schema/job.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Subcontractor.name) private subcontractorModel: Model<SubcontractorDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private companySocketService: CompanySocketService,
    private subcontractorSocketService: SubcontractorSocketService,
    private socketGateway: SocketGateway,
  ) { }

  async findOrCreateConversation(companyId: string, subcontractorId: string) {
    // Validate IDs are provided
    if (!companyId || !subcontractorId) {
      throw new HttpException(
        'Both companyId and subcontractorId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(companyId) || !Types.ObjectId.isValid(subcontractorId)) {
      throw new HttpException(
        'Invalid companyId or subcontractorId format',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if subcontractor exists
    const subcontractor = await this.subcontractorModel.findById(subcontractorId);
    if (!subcontractor) {
      throw new HttpException(
        'Subcontractor not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if company exists
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new HttpException(
        'Company not found',
        HttpStatus.NOT_FOUND,
      );
    }

    let convo = await this.conversationModel.findOne({ company: companyId, subcontractor: subcontractorId });
    if (!convo) {
      convo = await this.conversationModel.create({ company: companyId, subcontractor: subcontractorId });
    }
    return convo;
  }

  async getConversationsForUser(userId: string, userType: 'company' | 'subcontractor') {
    if (userType === 'company') {
      return this.conversationModel
        .find({ company: userId })
        .populate('subcontractor', 'fullName email primaryTrade profileImage')
        .sort({ lastMessageAt: -1 });
    } else {
      return this.conversationModel
        .find({ subcontractor: userId })
        .populate('company', 'companyName workEmail profileImage headOfficeAddress')
        .sort({ lastMessageAt: -1 });
    }
  }

  async getMessages(conversationId: string, limit = 50, skip = 0) {
    return this.messageModel.find({ conversation: conversationId })
      .populate('job', 'jobTitle trade description siteAddress timelineStartDate timelineEndDate hourlyRate workersRequired status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async sendMessage(conversationId: string, senderId: string, senderType: 'company' | 'subcontractor', content: string, attachments?: string[]) {
    const message = await this.messageModel.create({
      conversation: conversationId,
      sender: senderId,
      senderType,
      content,
      attachments,
    });

    // Set lastMessage based on content and attachments
    let lastMessage = content;
    if (!content && attachments && attachments.length > 0) {
      lastMessage = `📎 ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`;
    }

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage,
      lastMessageAt: new Date(),
      $inc: senderType === 'company' ? { unreadCountSubcontractor: 1 } : { unreadCountCompany: 1 },
    });

    // Emit socket notification to recipient
    // Find conversation to get both participants
    const convo = await this.conversationModel.findById(conversationId)
      .populate('company', 'companyName')
      .populate('subcontractor', 'fullName')
      .exec();

    if (!convo) {
      throw new Error('Conversation not found');
    }

    let recipientId: string;
    let recipientType: 'company' | 'subcontractor';
    let senderName: string;

    if (senderType === 'company') {
      recipientId = convo.subcontractor._id.toString();
      recipientType = 'subcontractor';
      senderName = (convo.company as any)?.companyName || 'Company';
    } else {
      recipientId = convo.company._id.toString();
      recipientType = 'company';
      senderName = (convo.subcontractor as any)?.fullName || 'Subcontractor';
    }

    // Send notification using appropriate socket service
    const messageData = {
      senderId,
      senderName,
      senderType,
      preview: content.substring(0, 100), // Limit preview length
      conversationId,
      messageId: (message as any)._id.toString(),
      content,
      attachments,
      createdAt: (message as any).createdAt,
    };

    // Emit to conversation room for real-time updates (for users actively viewing the chat)
    this.socketGateway.emitToConversation(conversationId, 'message:new', messageData);

    // Also send individual notifications (for users not in the conversation room)
    if (recipientType === 'company') {
      this.companySocketService.notifyNewMessage(recipientId, messageData);
    } else {
      this.subcontractorSocketService.notifyNewMessage(recipientId, messageData);
    }

    return message;
  }

  async markMessagesAsRead(conversationId: string, userType: 'company' | 'subcontractor') {
    if (userType === 'company') {
      await this.conversationModel.findByIdAndUpdate(conversationId, { unreadCountCompany: 0 });
    } else {
      await this.conversationModel.findByIdAndUpdate(conversationId, { unreadCountSubcontractor: 0 });
    }
  }

  async sendJobMessage(companyId: string, subcontractorId: string, jobId: string) {
    // Validate job exists and belongs to company
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (job.company.toString() !== companyId) {
      throw new HttpException(
        'You can only send your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    // Find or create conversation
    const conversation = await this.findOrCreateConversation(companyId, subcontractorId);

    // Create message with job reference
    const message = await this.messageModel.create({
      conversation: conversation._id.toString(),
      sender: companyId,
      senderType: 'company',
      content:  `📋 Sent a job: ${job.jobTitle}`,
      job: jobId,
    });

    // Update conversation
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage:  `📋 Job: ${job.jobTitle}`,
      lastMessageAt: new Date(),
      $inc: { unreadCountSubcontractor: 1 },
    });

    // Get company name for notification
    const company = await this.companyModel.findById(companyId, 'companyName');
    const senderName = company?.companyName || 'Company';

    const messageContent = `📋 Sent a job: ${job.jobTitle}`;

    // Prepare message data for socket
    const messageData = {
      senderId: companyId,
      senderName,
      senderType: 'company',
      preview: `📋 Job: ${job.jobTitle}`,
      conversationId: conversation._id.toString(),
      messageId: (message as any)._id.toString(),
      content: messageContent,
      jobId: jobId,
      jobTitle: job.jobTitle,
      createdAt: (message as any).createdAt,
    };

    // Emit to conversation room
    this.socketGateway.emitToConversation(
      conversation._id.toString(),
      'message:new',
      messageData,
    );

    // Send individual notification to subcontractor
    this.subcontractorSocketService.notifyNewMessage(subcontractorId, messageData);

    // Populate job before returning
    return this.messageModel.findById((message as any)._id)
      .populate('job', 'jobTitle trade description siteAddress timelineStartDate timelineEndDate hourlyRate workersRequired status')
      .exec();
  }
}
