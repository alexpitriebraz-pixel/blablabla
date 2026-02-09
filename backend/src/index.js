require('dotenv').config();

const http      = require('http');
const express   = require('express');
const cors      = require('cors');
const { Server } = require('socket.io');
const ntpClient = require('ntp-client');

const { initFirebase }      = require('./config/firebase');
const { connectDB }         = require('./config/db');
const { setupRoomSockets }  = require('./sockets/roomSockets');

const path = require('path');

const usersRouter   = require('./routes/users');
const roomsRouter   = require('./routes/rooms');
const youtubeRouter = require('./routes/youtube');

// ── Express ─────────────────────────────────────────────────────
const app = express();

app.use(express.json());

// Suporta múltiplas origens separadas por vírgula no .env
const corsOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({ origin: corsOrigins }));

app.use('/api/users',   usersRouter);
app.use('/api/rooms',   roomsRouter);
app.use('/api/youtube', youtubeRouter);

// Serve arquivos públicos (privacy policy, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Serve arquivos estáticos da raiz do projeto (index.html, app.html)
app.use(express.static(path.join(__dirname, '../../')));

// ── HTTP + Socket.IO ────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: corsOrigins },
});

// ── NTP ─────────────────────────────────────────────────────────
let ntpOffset = 0;

// Retorna o timestamp actual corrigido pelo offset NTP.
const getNtpTime = () => Date.now() + ntpOffset;

// Sincroniza uma vez no arranque; se falhar usa hora local.
const syncNTP = () =>
  new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[NTP] Timeout na sincronização — usando hora local');
      resolve(0);
    }, 5000);

    ntpClient.getNetworkTime('pool.ntp.org', 123, (err, time) => {
      clearTimeout(timeout);
      if (err) {
        console.warn('[NTP] Falha na sincronização — usando hora local');
        resolve(0);
      } else {
        const offset = time.getTime() - Date.now();
        console.log(`[NTP] Offset calculado: ${offset}ms`);
        resolve(offset);
      }
    });
  });

// ── Arranque ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Necessário para Render.com

(async () => {
  initFirebase();
  await connectDB();

  ntpOffset = await syncNTP();
  setupRoomSockets(io, getNtpTime, () => ntpOffset);

  httpServer.listen(PORT, HOST, () => {
    console.log(`[Server] BlaBlaBla rodando em ${HOST}:${PORT}`);
  });
})();
