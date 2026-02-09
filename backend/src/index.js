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

console.log('[Checkpoint 1/6] Iniciando servidor...');
console.log(`[Checkpoint] PORT=${PORT}, HOST=${HOST}`);

(async () => {
  try {
    console.log('[Checkpoint 2/6] Inicializando Firebase...');
    initFirebase();
    console.log('[Checkpoint 2/6] ✓ Firebase inicializado');

    console.log('[Checkpoint 3/6] Conectando ao MongoDB...');
    await connectDB();
    console.log('[Checkpoint 3/6] ✓ MongoDB conectado');

    console.log('[Checkpoint 4/6] Sincronizando NTP...');
    ntpOffset = await syncNTP();
    console.log(`[Checkpoint 4/6] ✓ NTP sincronizado (offset: ${ntpOffset}ms)`);

    console.log('[Checkpoint 5/6] Configurando Socket.IO...');
    setupRoomSockets(io, getNtpTime, () => ntpOffset);
    console.log('[Checkpoint 5/6] ✓ Socket.IO configurado');

    console.log('[Checkpoint 6/6] Iniciando servidor HTTP...');
    httpServer.listen(PORT, HOST, () => {
      console.log(`[Checkpoint 6/6] ✓ Servidor rodando em ${HOST}:${PORT}`);
      console.log('========================================');
      console.log('🎉 SERVIDOR ONLINE E PRONTO!');
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
