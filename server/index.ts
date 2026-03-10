import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/connectDB.ts';

import Signup from './routes/signupRoute.ts';
import Login from './routes/loginRoute.ts';
import Logout from './routes/logoutRoute.ts';
import DeleteAccount from './routes/deleteAccountRoute.ts';
// import AuthenticateToken, { IGetUserAuthInfoRequest } from './middleware/authenticateToken.ts';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth/signup', Signup);
app.use('/api/auth/login', Login);
app.use('/api/auth/logout', Logout);
app.use('/api/auth/delete', DeleteAccount);

// app.use('api/game/step', AuthenticateToken)

connectDB();

// Existing Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Error Handling Middleware (Optional but recommended)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
