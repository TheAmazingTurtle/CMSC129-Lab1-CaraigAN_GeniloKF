import express from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.ts';

type JwtPayload = {
  userId?: string;
  id?: string;
  _id?: string;
};

const AuthenticateToken: express.RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No entry without a soul (token).' });

  const JWT_SECRET = getJwtSecret();

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Your session has expired.' });

    const payload = (decoded && typeof decoded === 'object') ? (decoded as JwtPayload) : undefined;
    const rawUserId = payload?.userId ?? payload?.id ?? payload?._id;
    if (!rawUserId) return res.status(401).json({ message: 'Unauthorized' });

    res.locals.userId = String(rawUserId);
    next();
  });
};

export default AuthenticateToken;
