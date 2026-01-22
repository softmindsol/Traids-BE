/**
 * Socket.io Test Script
 * 
 * Usage:
 * 1. npm install socket.io-client
 * 2. node test/socket-test.js YOUR_JWT_TOKEN
 */

const { io } = require('socket.io-client');

const token = process.argv[2];

if (!token) {
  console.log('Usage: node test/socket-test.js YOUR_JWT_TOKEN');
  process.exit(1);
}

console.log('🔌 Connecting to Socket.io server...');

const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
});

socket.on('connected', (data) => {
  console.log('✅ Authenticated:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

// Listen for all notification types
socket.on('offer:received', (data) => {
  console.log('\n🎉 ========= OFFER RECEIVED =========');
  console.log(JSON.stringify(data, null, 2));
  console.log('=====================================\n');
});

socket.on('offer:accepted', (data) => {
  console.log('\n✅ ========= OFFER ACCEPTED =========');
  console.log(JSON.stringify(data, null, 2));
  console.log('=====================================\n');
});

socket.on('offer:rejected', (data) => {
  console.log('\n❌ ========= OFFER REJECTED =========');
  console.log(JSON.stringify(data, null, 2));
  console.log('=====================================\n');
});

socket.on('job:assigned', (data) => {
  console.log('\n📋 ========= JOB ASSIGNED =========');
  console.log(JSON.stringify(data, null, 2));
  console.log('===================================\n');
});

socket.on('notification', (data) => {
  console.log('\n🔔 ========= NOTIFICATION =========');
  console.log(JSON.stringify(data, null, 2));
  console.log('===================================\n');
});

// Test ping
setTimeout(() => {
  console.log('📤 Sending ping...');
  socket.emit('ping', {}, (response) => {
    console.log('📥 Pong:', response);
  });
}, 2000);

console.log('👂 Listening for notifications... (Press Ctrl+C to exit)');
console.log('💡 Now send an offer from a company account to test!\n');
