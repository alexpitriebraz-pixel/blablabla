const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Room = require('../models/Room');
const { generateRoomCode } = require('../services/roomUtils');

// POST /api/rooms
// Cria uma nova sala (o usuário que cria é automaticamente o host)
router.post('/', verifyToken, async (req, res) => {
  try {
    const room = await Room.create({
      code:    generateRoomCode(),
      hostId:  req.user.uid,
      members: [req.user.uid],
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:code
// Busca sala pelo código (usado antes de entrar via socket)
router.get('/:code', verifyToken, async (req, res) => {
  try {
    const room = await Room.findOne({
      code:   req.params.code.toUpperCase(),
      active: true,
    });
    if (!room) return res.status(404).json({ error: 'Sala não encontrada' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:code/join
// Adiciona o usuário aos membros da sala
router.post('/:code/join', verifyToken, async (req, res) => {
  try {
    const room = await Room.findOne({
      code:   req.params.code.toUpperCase(),
      active: true,
    });
    if (!room) return res.status(404).json({ error: 'Sala não encontrada' });

    if (!room.members.includes(req.user.uid)) {
      room.members.push(req.user.uid);
      await room.save();
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:code/leave
// Remove o usuário da sala; promove novo host ou desativa se vazio
router.post('/:code/leave', verifyToken, async (req, res) => {
  try {
    const room = await Room.findOne({
      code:   req.params.code.toUpperCase(),
      active: true,
    });
    if (!room) return res.status(404).json({ error: 'Sala não encontrada' });

    room.members = room.members.filter(id => id !== req.user.uid);

    if (room.members.length === 0) {
      room.active = false;
    } else if (room.hostId === req.user.uid) {
      room.hostId = room.members[0]; // promove o próximo membro
    }

    await room.save();
    res.json({ left: true, newHost: room.hostId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
