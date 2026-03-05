import { connectDB } from './config/connectDB.ts';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Player } from './models/Player.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is working!" });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(5000, () => {
    connectDB();
    console.log('Server running on 5000')
  });
}

app.post('/api/create-player', async (req, res) => {
  const newPlayer = new Player({ username: "PlayerOne", x: 100, y: 100 });
  await newPlayer.save();
  res.json({ message: "Player saved to Database!" });
});