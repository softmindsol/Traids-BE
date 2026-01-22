import { Injectable } from '@nestjs/common';
import { SocketService } from '../socket/socket.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schema/conversation.schema';
import { Message, MessageDocument } from './schema/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private socketService: SocketService,
  ) {}

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
    const convo = await this.conversationModel.findById(conversationId);
    if (!convo) {
      throw new Error('Conversation not found');
    }
    let recipientId: string;
    let recipientType: 'company' | 'subcontractor';
    if (senderType === 'company') {
      recipientId = convo.subcontractor.toString();
      recipientType = 'subcontractor';
    } else {
      recipientId = convo.company.toString();
      recipientType = 'company';
    }
    // Optionally, fetch sender name (not implemented here)
    this.socketService.notifyMessageReceived(recipientId, {
      senderId,
      senderName: senderType,
      preview: content,
      conversationId,
    });

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
