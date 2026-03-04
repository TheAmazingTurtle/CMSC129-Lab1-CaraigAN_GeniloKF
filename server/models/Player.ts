import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  lastLogin: { type: Date, default: Date.now }
});

export const Player = mongoose.model('Player', PlayerSchema);