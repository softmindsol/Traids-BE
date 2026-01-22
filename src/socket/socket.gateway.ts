import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this for production
    credentials: true,
  },
  namespace: '/',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  // Map to store userId -> socketId for direct messaging
  private userSocketMap = new Map<string, string[]>();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        // Allow connection but don't associate with user
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });

      const userId = payload.sub;
      const userType = payload.userType;

      // Store socket mapping
      client.data.userId = userId;
      client.data.userType = userType;

      // Add socket to user's socket list (user can have multiple connections)
      const existingSockets = this.userSocketMap.get(userId) || [];
      existingSockets.push(client.id);
      this.userSocketMap.set(userId, existingSockets);

      // Join user-specific room for targeted messaging
      client.join(`user:${userId}`);
      client.join(`type:${userType}`); // e.g., type:company or type:subcontractor

      this.logger.log(
        `Client connected: ${client.id} | User: ${userId} | Type: ${userType}`,
      );

      // Send connection success event
      client.emit('connected', {
        message: 'Successfully connected to WebSocket',
        userId,
        userType,
      });
    } catch (error) {
      this.logger.error(`Connection error for ${client.id}: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Remove socket from user's socket list
      const existingSockets = this.userSocketMap.get(userId) || [];
      const updatedSockets = existingSockets.filter((id) => id !== client.id);

      if (updatedSockets.length > 0) {
        this.userSocketMap.set(userId, updatedSockets);
      } else {
        this.userSocketMap.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id} | User: ${userId}`);
  }

  // Get the socket server instance (for use in services)
  getServer(): Server {
    return this.server;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSocketMap.has(userId);
  }

  // Get all online users
  getOnlineUsers(): string[] {
    return Array.from(this.userSocketMap.keys());
  }

  // Listen for client joining a room
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    this.logger.log(`Client ${client.id} joined room: ${data.room}`);
    return { success: true, room: data.room };
  }

  // Listen for client leaving a room
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    this.logger.log(`Client ${client.id} left room: ${data.room}`);
    return { success: true, room: data.room };
  }

  // Ping-pong for connection testing
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', timestamp: new Date().toISOString() };
  }
}
