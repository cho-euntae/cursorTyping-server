// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // 개발 중엔 모두 허용 (필요시 도메인 제한)
    methods: ['GET', 'POST'],
  },
});

// 소켓 연결
io.on('connection', (socket) => {
  console.log('✅ 클라이언트 연결됨:', socket.id);

  socket.on('createRoom', (roomId) => {
    socket.join(roomId);
    console.log(`방 생성됨: ${roomId}`);
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`방 참여함: ${roomId}`);
  });

  socket.on('typingProgress', (data) => {
    socket.to(data.roomId).emit('userProgress', data);
  });

  socket.on('chatMessage', (data) => {
    const { roomId, message, username } = data;
    io.to(roomId).emit('newMessage', {
      message,
      username,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ 클라이언트 연결 해제됨:', socket.id);
  });
});

server.listen(4000, () => {
  console.log('🚀 Socket.IO 서버 실행 중: http://localhost:4000');
});

app.get('/', (req, res) => {
  res.send('Socket.IO 서버 실행 중');
});
