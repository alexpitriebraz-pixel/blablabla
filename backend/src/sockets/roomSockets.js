const admin = require('firebase-admin');
const Room = require('../models/Room');

// Extrai a lógica de saída da sala para evitar duplicação
// entre o evento 'leave_room' e o 'disconnect'.
const handleLeave = async (io, room, uid) => {
  room.members = room.members.filter(id => id !== uid);

  if (room.members.length === 0) {
    room.active = false;
  } else if (room.hostId === uid) {
    room.hostId = room.members[0];
    io.to(room.code).emit('host_changed', { newHost: room.hostId });
  }

  await room.save();
  io.to(room.code).emit('member_left', { uid });
};

const setupRoomSockets = (io, getNtpTime, getNtpOffset) => {
  io.on('connection', (socket) => {
    let uid     = null;   // Firebase UID do utilizador autenticado
    let roomCode = null;  // Código da sala actual do socket

    // ── Autenticação ────────────────────────────────────────────
    socket.on('authenticate', async ({ token }) => {
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
        socket.emit('authenticated', { uid, ntpOffset: getNtpOffset() });
      } catch {
        socket.emit('error', { message: 'Token inválido ou expirado' });
        socket.disconnect();
      }
    });

    // ── Entrar numa sala ────────────────────────────────────────
    socket.on('join_room', async ({ code }) => {
      try {
        if (!uid) return socket.emit('error', { message: 'Não autenticado' });

        const room = await Room.findOne({ code: code.toUpperCase(), active: true });
        if (!room) return socket.emit('error', { message: 'Sala não encontrada' });

        if (!room.members.includes(uid)) {
          room.members.push(uid);
          await room.save();
        }

        roomCode = room.code;
        socket.join(roomCode);

        socket.to(roomCode).emit('member_joined', { uid });
        socket.emit('room_state', { room });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Sair da sala ────────────────────────────────────────────
    socket.on('leave_room', async () => {
      if (!roomCode || !uid) return;
      try {
        const room = await Room.findOne({ code: roomCode, active: true });
        if (room) await handleLeave(io, room, uid);

        socket.leave(roomCode);
        roomCode = null;
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Reproduzir uma nova faixa (host only) ──────────────────
    socket.on('play', async ({ trackUri, trackName, trackArtist }) => {
      try {
        if (!roomCode || !uid) return;

        const room = await Room.findOne({ code: roomCode });
        if (room.hostId !== uid) {
          return socket.emit('error', { message: 'Apenas o host pode controlar o playback' });
        }

        room.playbackState = {
          trackUri,
          trackName,
          trackArtist,
          isPlaying:  true,
          position:   0,
          startedAt:  new Date(getNtpTime()),
        };
        await room.save();

        io.to(roomCode).emit('playback_update', { playbackState: room.playbackState });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Pausar (host only) ──────────────────────────────────────
    socket.on('pause', async () => {
      try {
        if (!roomCode || !uid) return;

        const room = await Room.findOne({ code: roomCode });
        if (room.hostId !== uid) {
          return socket.emit('error', { message: 'Apenas o host pode controlar o playback' });
        }

        if (room.playbackState?.isPlaying) {
          const now = getNtpTime();
          // Calcula a posição actual no momento da pausa
          room.playbackState.position  += now - room.playbackState.startedAt.getTime();
          room.playbackState.isPlaying  = false;
          room.playbackState.startedAt  = new Date(now);
          await room.save();
        }

        io.to(roomCode).emit('playback_update', { playbackState: room.playbackState });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Retomar (host only) ─────────────────────────────────────
    socket.on('resume', async () => {
      try {
        if (!roomCode || !uid) return;

        const room = await Room.findOne({ code: roomCode });
        if (room.hostId !== uid) {
          return socket.emit('error', { message: 'Apenas o host pode controlar o playback' });
        }

        if (room.playbackState && !room.playbackState.isPlaying) {
          room.playbackState.isPlaying = true;
          room.playbackState.startedAt = new Date(getNtpTime());
          await room.save();
        }

        io.to(roomCode).emit('playback_update', { playbackState: room.playbackState });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Seek (host only) ────────────────────────────────────────
    socket.on('seek', async ({ position }) => {
      try {
        if (!roomCode || !uid) return;

        const room = await Room.findOne({ code: roomCode });
        if (room.hostId !== uid) {
          return socket.emit('error', { message: 'Apenas o host pode controlar o playback' });
        }

        if (!room.playbackState?.trackUri) {
          return socket.emit('error', { message: 'Nenhuma faixa em reprodução' });
        }

        room.playbackState.position  = position;
        room.playbackState.startedAt = new Date(getNtpTime());
        await room.save();

        io.to(roomCode).emit('playback_update', { playbackState: room.playbackState });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Desconexão ──────────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (!roomCode || !uid) return;
      try {
        const room = await Room.findOne({ code: roomCode, active: true });
        if (room) await handleLeave(io, room, uid);
      } catch (err) {
        console.error('[Socket] Erro no disconnect:', err.message);
      }
    });
  });
};

module.exports = { setupRoomSockets };
