const axios = require('axios');

const refreshSpotifyToken = async (refreshToken) => {
  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: {
        username: process.env.SPOTIFY_CLIENT_ID,
        password: process.env.SPOTIFY_CLIENT_SECRET,
      },
    }
  );

  return data; // { access_token, expires_in, token_type, scope }
};

module.exports = { refreshSpotifyToken };
