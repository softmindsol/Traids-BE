import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SocketService } from '../socket/socket.service';
import { S3UploadService } from '../common/service/s3-upload.service';
import { ChatController } from './chat.controller';
import { Conversation, ConversationSchema } from './schema/conversation.schema';
import { Message, MessageSchema } from './schema/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    JwtModule.register({
          secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
          signOptions: { expiresIn: '7d' },
        }),
  ],
  controllers: [ChatController],
  providers: [ChatService, SocketService, S3UploadService],
  exports: [ChatService],
})
export class ChatModule {}
