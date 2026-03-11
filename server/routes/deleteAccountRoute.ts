import express from 'express';
import AuthenticateToken from '../middleware/authenticateToken.ts';
import { isDatabaseAvailable, deleteUserById } from '../services/userStore.ts';

const DeleteAccount: express.RequestHandler = async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    const userId = res.locals.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await deleteUserById(userId);

    return res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const router = express.Router();
router.delete('/', AuthenticateToken, DeleteAccount);

export default router;
