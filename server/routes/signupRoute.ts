import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getJwtSecret, getJwtExpiresIn } from '../config/env.ts';
import { validateAuthPayload } from '../validators/auth.ts';
import { isDatabaseAvailable, findUserByEmail, createUser } from '../services/userStore.ts';

const Signup = async (req: express.Request, res: express.Response) => {
  try {
    const payload = validateAuthPayload(req.body);
    if (!payload.ok) return res.status(400).json({ message: payload.message });

    if (!isDatabaseAvailable()) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    const { email, password } = payload;

    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = await createUser(email, hashedPassword);

    // Generate Token
    const token = jwt.sign({ userId: newUser._id }, getJwtSecret(), { expiresIn: getJwtExpiresIn() });

    res.status(201).json({ token, user: { email: newUser.email, id: newUser._id } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default Signup;
