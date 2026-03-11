import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getJwtSecret, getJwtExpiresIn } from '../config/env.ts';
import { validateAuthPayload } from '../validators/auth.ts';
import { isDatabaseAvailable, findUserByEmail } from '../services/userStore.ts';

const Login = async (req: express.Request, res: express.Response) => {
  try {
    const payload = validateAuthPayload(req.body);
    if (!payload.ok) return res.status(400).json({ message: payload.message });

    if (!isDatabaseAvailable()) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    const { email, password } = payload;

    // 1. Find user
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'User not found' });

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // 3. Generate Token
    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: getJwtExpiresIn() });

    res.json({
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default Login;
