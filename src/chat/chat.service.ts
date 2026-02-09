import { Injectable } from '@nestjs/common';
import { CompanySocketService } from '../socket/companySocket.service';
import { SubcontractorSocketService } from '../socket/subcontractorSocket.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schema/conversation.schema';
import { Message, MessageDocument } from './schema/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private companySocketService: CompanySocketService,
    private subcontractorSocketService: SubcontractorSocketService,
  ) { }

  async findOrCreateConversation(companyId: string, subcontractorId: string) {
    let convo = await this.conversationModel.findOne({ company: companyId, subcontractor: subcontractorId });
    if (!convo) {
      convo = await this.conversationModel.create({ company: companyId, subcontractor: subcontractorId });
    }
    return convo;
  }

  async getConversationsForUser(userId: string, userType: 'company' | 'subcontractor') {
    if (userType === 'company') {
      return this.conversationModel.find({ company: userId }).sort({ lastMessageAt: -1 });
    } else {
      return this.conversationModel.find({ subcontractor: userId }).sort({ lastMessageAt: -1 });
    }
  }

  async getMessages(conversationId: string, limit = 50, skip = 0) {
    return this.messageModel.find({ conversation: conversationId })
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
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: content,
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
      preview: content.substring(0, 100), // Limit preview length
      conversationId,
      messageId: (message as any)._id.toString(),
    };

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
}
