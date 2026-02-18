# Real-Time Chat Implementation Guide

## Backend Changes Completed ✅

The backend now supports real-time chat with conversation rooms:

### 1. Socket Gateway Enhancements
- **Join Conversation**: Users can join a conversation room with participant validation
- **Leave Conversation**: Users can leave a conversation room
- **Room-Based Broadcasting**: Messages are broadcast to all users in a conversation room

### 2. Chat Service Updates
- Emits messages to conversation rooms (`conversation:${conversationId}`)
- Sends dual notifications: room-based + individual user notifications
- Enhanced message data includes full content and attachments

---

## Frontend Implementation

### 1. Install Socket.io Client

```bash
npm install socket.io-client
```

### 2. Create Socket Service

```typescript
// services/socket.service.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Connected to WebSocket:', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string, callback: (response: any) => void) {
    if (this.socket) {
      this.socket.emit('joinConversation', { conversationId }, callback);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('leaveConversation', { conversationId });
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('message:new');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
```

### 3. Chat Component Implementation

#### React Example

```typescript
import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket.service';
import axios from 'axios';

interface Message {
  _id: string;
  senderId: string;
  senderType: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

const ChatComponent = ({ conversationId, currentUserId, authToken }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Connect to socket when component mounts
    socketService.connect(authToken);

    // Load initial messages
    loadMessages();

    // Join conversation room
    socketService.joinConversation(conversationId, (response) => {
      if (response.success) {
        console.log('✅ Joined conversation:', response.room);
      } else {
        console.error('❌ Failed to join conversation:', response.error);
      }
    });

    // Listen for new messages
    socketService.onNewMessage((messageData) => {
      console.log('📨 New message received:', messageData);
      
      // Only add message if it's for this conversation
      if (messageData.conversationId === conversationId) {
        // Create message object from the data
        const newMsg: Message = {
          _id: messageData.messageId,
          senderId: messageData.senderId,
          senderType: messageData.senderType,
          content: messageData.content,
          attachments: messageData.attachments,
          createdAt: messageData.createdAt,
        };

        // Add to messages list
        setMessages((prev) => [...prev, newMsg]);
        scrollToBottom();
      }
    });

    // Cleanup on unmount
    return () => {
      socketService.leaveConversation(conversationId);
      socketService.offNewMessage();
    };
  }, [conversationId, authToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/chat/messages/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setMessages(response.data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        'http://localhost:3000/chat/send',
        {
          conversationId,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setNewMessage('');
      // Message will be added via socket event
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-list">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={msg.senderId === currentUserId ? 'message-sent' : 'message-received'}
          >
            <p>{msg.content}</p>
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="attachments">
                {msg.attachments.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                    📎 Attachment {idx + 1}
                  </a>
                ))}
              </div>
            )}
            <small>{new Date(msg.createdAt).toLocaleString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

#### Vue.js Example

```typescript
<template>
  <div class="chat-container">
    <div class="messages-list" ref="messagesList">
      <div
        v-for="msg in messages"
        :key="msg._id"
        :class="msg.senderId === currentUserId ? 'message-sent' : 'message-received'"
      >
        <p>{{ msg.content }}</p>
        <div v-if="msg.attachments && msg.attachments.length > 0" class="attachments">
          <a
            v-for="(url, idx) in msg.attachments"
            :key="idx"
            :href="url"
            target="_blank"
          >
            📎 Attachment {{ idx + 1 }}
          </a>
        </div>
        <small>{{ formatDate(msg.createdAt) }}</small>
      </div>
    </div>

    <div class="message-input">
      <input
        v-model="newMessage"
        @keypress.enter="sendMessage"
        placeholder="Type a message..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import socketService from '../services/socket.service';
import axios from 'axios';

const props = defineProps({
  conversationId: String,
  currentUserId: String,
  authToken: String,
});

const messages = ref([]);
const newMessage = ref('');
const messagesList = ref(null);

const scrollToBottom = () => {
  if (messagesList.value) {
    messagesList.value.scrollTop = messagesList.value.scrollHeight;
  }
};

const loadMessages = async () => {
  try {
    const response = await axios.get(
      `http://localhost:3000/chat/messages/${props.conversationId}`,
      { headers: { Authorization: `Bearer ${props.authToken}` } }
    );
    messages.value = response.data.reverse();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  try {
    await axios.post(
      'http://localhost:3000/chat/send',
      {
        conversationId: props.conversationId,
        content: newMessage.value,
      },
      { headers: { Authorization: `Bearer ${props.authToken}` } }
    );

    newMessage.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

onMounted(() => {
  socketService.connect(props.authToken);
  loadMessages();

  socketService.joinConversation(props.conversationId, (response) => {
    if (response.success) {
      console.log('✅ Joined conversation:', response.room);
    }
  });

  socketService.onNewMessage((messageData) => {
    if (messageData.conversationId === props.conversationId) {
      messages.value.push({
        _id: messageData.messageId,
        senderId: messageData.senderId,
        senderType: messageData.senderType,
        content: messageData.content,
        attachments: messageData.attachments,
        createdAt: messageData.createdAt,
      });
      scrollToBottom();
    }
  });
});

onUnmounted(() => {
  socketService.leaveConversation(props.conversationId);
  socketService.offNewMessage();
});

watch(messages, () => {
  setTimeout(scrollToBottom, 100);
});
</script>
```

---

## Event Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joinConversation` | `{ conversationId: string }` | Join a conversation room |
| `leaveConversation` | `{ conversationId: string }` | Leave a conversation room |
| `ping` | - | Test connection (returns `pong`) |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ message, userId, userType }` | Successful connection |
| `message:new` | `{ senderId, senderName, senderType, content, attachments, conversationId, messageId, createdAt }` | New message in conversation |
| `error` | `{ message }` | Error notification |
| `pong` | `{ event: 'pong', timestamp }` | Connection test response |

---

## Real-Time Flow

```
User Opens Chat
    ↓
Connect to Socket.io (with JWT)
    ↓
Join Conversation Room
    ↓
Load Initial Messages (HTTP)
    ↓
Listen for 'message:new' Event
    ↓
User Sends Message (HTTP POST)
    ↓
Backend Saves Message
    ↓
Backend Emits to Conversation Room
    ↓
All Connected Clients Receive Event
    ↓
Update UI in Real-Time
```

---

## Security Features

✅ **JWT Authentication**: Required for socket connection  
✅ **Participant Validation**: Only conversation participants can join rooms  
✅ **ObjectId Validation**: Prevents invalid conversation IDs  
✅ **Dual Notifications**: Room-based (real-time) + individual (fallback)

---

## Testing

### 1. Test Socket Connection

```javascript
// In browser console
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connected', (data) => console.log('Connected:', data));
```

### 2. Test Join Conversation

```javascript
socket.emit('joinConversation', { conversationId: 'CONVERSATION_ID' }, (response) => {
  console.log('Join response:', response);
});
```

### 3. Test Message Listening

```javascript
socket.on('message:new', (data) => {
  console.log('New message:', data);
});
```

---

## Troubleshooting

### Issue: Socket Not Connecting
- **Solution**: Check JWT token is valid and not expired
- **Solution**: Verify backend is running on correct port
- **Solution**: Check CORS configuration

### Issue: Not Receiving Messages
- **Solution**: Ensure `joinConversation` succeeded
- **Solution**: Check conversation ID is correct
- **Solution**: Verify you're listening to `message:new` event

### Issue: "Not a participant" Error
- **Solution**: Verify the logged-in user is part of the conversation
- **Solution**: Check company/subcontractor ID matches conversation participants

---

## Next Steps

1. ✅ Backend conversation rooms implemented
2. ✅ Socket gateway with validation ready
3. 🔄 Implement frontend socket service
4. 🔄 Integrate into chat UI component
5. 🔄 Add typing indicators (optional)
6. 🔄 Add online status indicators (optional)
7. 🔄 Add message delivery receipts (optional)

---

## Optional Enhancements

### Typing Indicators

```typescript
// Backend: Add to socket.gateway.ts
@SubscribeMessage('typing:start')
handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
  const userId = client.data.userId;
  this.emitToConversation(data.conversationId, 'typing:status', {
    userId,
    isTyping: true,
  });
}

@SubscribeMessage('typing:stop')
handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
  const userId = client.data.userId;
  this.emitToConversation(data.conversationId, 'typing:status', {
    userId,
    isTyping: false,
  });
}
```

### Online Status

```typescript
// Use existing isUserOnline method in gateway
socket.emit('checkUserStatus', { userId: 'USER_ID' }, (response) => {
  console.log('User online:', response.isOnline);
});
```

---

## Summary

Your backend is now fully configured for real-time chat! The conversation room system ensures:
- Messages appear instantly for users viewing the chat
- Efficient broadcasting to multiple connections
- Secure participant-only access
- Fallback notifications for offline users

Simply integrate the frontend socket service and start chatting in real-time! 🚀
