import express from 'express';
import AuthenticateToken from '../middleware/authenticateToken.ts';

const router = express.Router();

router.get('/', AuthenticateToken, (req, res) => {
  return res.json({ user: { id: res.locals.userId } });
});

export default router;
