import express from 'express';
import User from '../models/User.ts';
import AuthenticateToken, { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

const DeleteAccount = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const payload = req.user as { userId?: string } | undefined;
    const userId = payload?.userId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await User.findByIdAndDelete(userId);
    return res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const router = express.Router();
router.delete('/', AuthenticateToken, DeleteAccount);

export default router;
