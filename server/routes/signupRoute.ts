import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { getBackupUserModel, getActiveUserModel, isPrimaryConnected, isBackupConnected } from '../models/UserBackup.ts';

const Signup = async (req: express.Request, res: express.Response) => {
  try {
    dotenv.config();
    const JWT_SECRET = process.env.JWT_SECRET || '';

    const { email, password } = req.body;

    const primaryConnected = isPrimaryConnected();
    const backupConnected = isBackupConnected();
    if (!primaryConnected && !backupConnected) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    // Check if user exists
    const ActiveUser = getActiveUserModel();
    let existingUser = await ActiveUser.findOne({ email });

    if (!existingUser && primaryConnected && backupConnected) {
      const BackupUser = getBackupUserModel();
      if (BackupUser) {
        existingUser = await BackupUser.findOne({ email });
      }
    }

    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new ActiveUser({ email, password: hashedPassword });
    await newUser.save();

    if (primaryConnected && backupConnected) {
      const BackupUser = getBackupUserModel();
      if (BackupUser) {
        try {
          await BackupUser.create({ email, password: hashedPassword });
        } catch (err) {
          console.warn('Backup signup failed:', err);
        }
      }
    }

    // Generate Token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user: { email: newUser.email, id: newUser._id } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export default Signup;
