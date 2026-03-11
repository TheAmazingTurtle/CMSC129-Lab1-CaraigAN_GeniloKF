import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

type JwtPayload = {
  userId?: string;
  id?: string;
  _id?: string;
};

const AuthenticateToken: express.RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No entry without a soul (token).' });

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
