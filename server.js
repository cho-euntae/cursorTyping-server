require('dotenv').config(); // 반드시 가장 위에

// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // 개발 중엔 모두 허용 (필요시 도메인 제한)
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;
const SOCKET_URL = process.env.SOCKET_SERVER_URL || 'http://localhost';

// 회원가입 API
app.post('/api/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 이메일 중복 확인
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email ? '이미 사용 중인 이메일입니다.' : '이미 사용 중인 사용자 이름입니다.',
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    res.json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

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
  console.log('SOCKET URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
  console.log('PORT:', process.env.PORT);
});

app.get('/', (req, res) => {
  res.send('Socket.IO 서버 실행 중');
});
