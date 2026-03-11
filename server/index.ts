import express from 'express';
import cors from 'cors';
import { connectDB } from './config/connectDB.ts';
import { getPort } from './config/env.ts';

import Signup from './routes/signupRoute.ts';
import Login from './routes/loginRoute.ts';
import Logout from './routes/logoutRoute.ts';
import DeleteAccount from './routes/deleteAccountRoute.ts';
import SaveRoute from './routes/saveRoute.ts';
import MeRoute from './routes/meRoute.ts';

const app = express();
const PORT = getPort();

app.use(cors());
app.use(express.json());

app.use('/api/auth/signup', Signup);
app.use('/api/auth/login', Login);
app.use('/api/auth/logout', Logout);
app.use('/api/auth/delete', DeleteAccount);
app.use('/api/auth/me', MeRoute);
app.use('/api/player', SaveRoute);

connectDB();

// Existing Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is woking!' });
});

// Error Handling Middleware (Optional but recommended)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
