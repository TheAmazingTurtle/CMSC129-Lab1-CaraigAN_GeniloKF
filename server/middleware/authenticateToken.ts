import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Extends the Express Request type so game routes can safely read req.user.userId
// without casting. All JWT payloads signed by this app include a userId field.
export interface IGetUserAuthInfoRequest extends express.Request {
  user?: { userId: string } & jwt.JwtPayload
}

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in environment variables.");
  process.exit(1);
}

const AuthenticateToken = (req: IGetUserAuthInfoRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No entry without a soul (token)." });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Your session has expired." });
        req.user = decoded as { userId: string } & jwt.JwtPayload;
        next();
    });
};

export default AuthenticateToken;