const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/youtube/search?q=...
// Proxy para a YouTube Data API v3 — retorna lista de vídeos
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'Parâmetro q é obrigatório' });

    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key:        process.env.YOUTUBE_API_KEY,
        q,
        part:       'snippet',
        type:       'video',
        maxResults: Math.min(Number(maxResults), 25),
        order:      'relevance',
      },
    });

    const results = data.items.map(item => ({
      videoId:      item.id.videoId,
      title:        item.snippet.title,
      thumbnail:    item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
    }));

    res.json(results);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        error: err.response.data?.error?.message || 'Erro na API do YouTube',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
