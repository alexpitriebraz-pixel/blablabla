const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { refreshSpotifyToken } = require('../services/spotifyService');

// GET /api/users/me
// Retorna o perfil do usuário autenticado (cria se não existir)
router.get('/me', verifyToken, async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: req.user.uid,
        email:       req.user.email,
        displayName: req.user.name,
        photoURL:    req.user.picture,
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/spotify/connect
// Salva os tokens do Spotify após o OAuth no cliente
router.post('/spotify/connect', verifyToken, async (req, res) => {
  try {
    const { accessToken, refreshToken, expiresIn } = req.body;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      {
        spotify: {
          accessToken,
          refreshToken,
          expiresAt,
          connected: true,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ connected: true, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/spotify/token
// Retorna um token Spotify válido — faz refresh automaticamente se expirado
router.get('/spotify/token', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user?.spotify?.connected) {
      return res.status(404).json({ error: 'Spotify não conectado' });
    }

    // Token expirado → refresh
    if (new Date() >= user.spotify.expiresAt) {
      const fresh = await refreshSpotifyToken(user.spotify.refreshToken);
      user.spotify.accessToken = fresh.access_token;
      user.spotify.expiresAt   = new Date(Date.now() + fresh.expires_in * 1000);
      await user.save();
    }

    res.json({ accessToken: user.spotify.accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
