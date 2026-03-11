import express from 'express';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { getBackupUserModel, getActiveUserModel, isPrimaryConnected, isBackupConnected } from '../models/UserBackup.ts';

const Login = async (req: express.Request, res: express.Response) => {
  try {
    dotenv.config();
    const JWT_SECRET = process.env.JWT_SECRET || '';

    const { email, password } = req.body;

    const primaryConnected = isPrimaryConnected();
    const backupConnected = isBackupConnected();
    if (!primaryConnected && !backupConnected) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    // 1. Find user
    const ActiveUser = getActiveUserModel();
    let user = await ActiveUser.findOne({ email });

    if (!user && primaryConnected && backupConnected) {
      const BackupUser = getBackupUserModel();
      if (BackupUser) {
        user = await BackupUser.findOne({ email });
      }
    }

    if (!user) return res.status(400).json({ message: "User not found" });

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 3. Generate Token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      token, 
      user: { id: user._id, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export default Login;
