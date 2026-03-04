import { connectDB } from './config/connectDB.ts';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Player } from './models/Player.ts';

const app = express();
const httpServer = createServer(app);
app.use(cors()); 

app.get('/api/status', (req, res) => {
  res.json({ message: "Server is alive and gaming!" });
});

// THIS LINE keeps the server running:
httpServer.listen(5000, () => {
    connectDB();
    console.log("Server running on port 5000");
});

app.post('/api/create-player', async (req, res) => {
  const newPlayer = new Player({ username: "PlayerOne", x: 100, y: 100 });
  await newPlayer.save();
  res.json({ message: "Player saved to Database!" });
});