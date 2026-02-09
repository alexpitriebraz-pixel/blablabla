const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    // Código de 6 caracteres que os usuários digitam para entrar
    code: { type: String, required: true, unique: true, uppercase: true },

    // Usuário que criou a sala (controla o playback)
    hostId: { type: String, required: true },

    // Lista de firebaseUids dos membros ativos
    members: [{ type: String }],

    // Estado atual do playback — sincronizado via NTP
    playbackState: {
      trackUri:    { type: String },   // ex: "spotify:track:abc123"
      trackName:   { type: String },
      trackArtist: { type: String },
      isPlaying:   { type: Boolean, default: false },
      position:    { type: Number, default: 0 },  // posição em ms no momento de startedAt
      startedAt:   { type: Date },                 // timestamp NTP do momento em que tocou/seekou
    },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Salas inativas expiram automaticamente após 24h
roomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', roomSchema);
