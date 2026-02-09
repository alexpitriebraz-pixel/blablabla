const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid:  { type: String, required: true, unique: true },
    email:        { type: String },
    displayName:  { type: String },
    photoURL:     { type: String },

    // Dados da integração Spotify (preenchidos após OAuth)
    spotify: {
      accessToken:  { type: String },
      refreshToken: { type: String },
      expiresAt:    { type: Date },
      connected:    { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
