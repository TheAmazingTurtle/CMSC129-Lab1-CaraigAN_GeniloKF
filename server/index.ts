import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/connectDB.ts';

import Signup   from './routes/signupRoute.ts';
import Login    from './routes/loginRoute.ts';
import Logout   from './routes/logoutRoute.ts';

import AuthenticateToken from './middleware/authenticateToken.ts';
import GetState from './routes/getStateRoute.ts';
import Save     from './routes/saveRoute.ts';
import Step     from './routes/stepRoute.ts';
import Equip    from './routes/equipRoute.ts';
import Sell     from './routes/sellRoute.ts';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Auth routes (public) ---
app.use('/api/auth/signup', Signup);
app.use('/api/auth/login',  Login);
app.use('/api/auth/logout', Logout);

// --- Game routes (JWT protected) ---
app.get('/api/game/state',  AuthenticateToken, GetState);
app.post('/api/game/save',  AuthenticateToken, Save);
app.post('/api/game/step',  AuthenticateToken, Step);
app.post('/api/game/equip', AuthenticateToken, Equip);
app.post('/api/game/sell',  AuthenticateToken, Sell);

connectDB();

// Smoke-test route
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));