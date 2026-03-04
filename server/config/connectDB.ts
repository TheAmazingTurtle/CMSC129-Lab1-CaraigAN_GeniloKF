import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns'

function connectDB() {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    
    dotenv.config();
    const MONGO_URI = process.env.MONGO_URI || '';
    mongoose.connect(MONGO_URI)
      .then(() => console.log("Connected to MongoDB Atlas"))
      .catch((err) => console.error("MongoDB connection error:", err));
}

export { connectDB }