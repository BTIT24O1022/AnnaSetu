const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ override: true });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── Middleware ────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Import Routes ─────────────────────────────────
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const dispatchRoutes = require('./routes/dispatch');
const impactRoutes = require('./routes/impact');
const hungerPinRoutes = require('./routes/hungerpin');
const whatsappRoutes = require('./routes/whatsapp');
const foodclockRoutes = require('./routes/foodclock');

// ─── Health Check ──────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '✅ AnnaSetu API is running!',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      donations: '/api/donations',
      dispatch: '/api/dispatch',
      impact: '/api/impact',
      hungerPins: '/api/hungerpins'
    }
  });
});

// ─── Use Routes ────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/hungerpins', hungerPinRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/foodclock', foodclockRoutes);
// ─── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── Socket.io ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`✅ User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

app.set('io', io);

// ─── Start Server ──────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('🌱 ================================');
  console.log('🌱  AnnaSetu Server Started!');
  console.log(`🌱  http://localhost:${PORT}`);
  console.log('🌱 ================================');
  console.log('');
});

module.exports = { app, io };
