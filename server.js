require('dotenv').config(); // 반드시 가장 위에

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

const PORT = process.env.PORT || 4000;
const SOCKET_URL = process.env.SOCKET_SERVER_URL || 'http://localhost';

// 소켓 연결
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);

  socket.on('createRoom', (roomId) => {
    socket.join(roomId);
    console.log(`방 생성됨: ${roomId}, socket.id: ${socket.id}`);
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`방 참여함: ${roomId}, socket.id: ${socket.id}`);
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
    console.log('클라이언트 연결 해제됨:', socket.id);
  });
});

server.listen(PORT, () => {
  // console.log(`Socket.IO 서버 실행 중: ${SOCKET_URL}:${PORT}`);
  console.log(`Socket.IO 서버 실행 중: ${process.env.SOCKET_SERVER_URL}:${process.env.PORT}`);
});

app.get('/', (req, res) => {
  res.send('Socket.IO 서버 실행 중');
});
