import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

let backupConnection: mongoose.Connection | null = null;

function connectDB() {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);

  dotenv.config();
  const MONGO_URI = process.env.MONGO_URI || '';
  const MONGO_URI_BACKUP = process.env.MONGO_URI_BACKUP || '';

  mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas (primary)"))
    .catch((err) => console.error("MongoDB connection error (primary):", err));

  if (MONGO_URI_BACKUP) {
    backupConnection = mongoose.createConnection(MONGO_URI_BACKUP);
    backupConnection.on('connected', () => console.log('Connected to MongoDB Atlas (backup)'));
    backupConnection.on('error', (err) => console.error('MongoDB connection error (backup):', err));
  }
}

export { connectDB, backupConnection };
