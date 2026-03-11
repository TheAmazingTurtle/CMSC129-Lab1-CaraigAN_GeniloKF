import express from 'express';
import { getBackupUserModel, isPrimaryConnected, isBackupConnected, getActiveUserModel } from '../models/UserBackup.ts';
import AuthenticateToken from '../middleware/authenticateToken.ts';

const DeleteAccount: express.RequestHandler = async (req, res) => {
  try {
    const primaryConnected = isPrimaryConnected();
    const backupConnected = isBackupConnected();
    if (!primaryConnected && !backupConnected) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    const userId = res.locals.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const ActiveUser = getActiveUserModel();
    await ActiveUser.findByIdAndDelete(userId);

    if (primaryConnected && backupConnected) {
      const BackupUser = getBackupUserModel();
      if (BackupUser) {
        try {
          await BackupUser.findByIdAndDelete(userId);
        } catch (err) {
          console.warn('Backup delete failed:', err);
        }
      }
    }

    return res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const router = express.Router();
router.delete('/', AuthenticateToken, DeleteAccount);

export default router;
