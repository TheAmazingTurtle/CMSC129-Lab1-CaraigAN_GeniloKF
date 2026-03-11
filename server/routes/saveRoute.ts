import express from 'express';
import {
  getBackupUserModel,
  getActiveUserModel,
  isPrimaryConnected,
  isBackupConnected,
} from '../models/UserBackup.ts';
import AuthenticateToken from '../middleware/authenticateToken.ts';

const router = express.Router();

const buildPlayerPayload = (user: any) => ({
  level: user.level ?? 1,
  gold: user.gold ?? 0,
  exp: user.exp ?? 0,
  hp: user.hp ?? 100,
  skillPoints: user.skillPoints ?? 0,
  skillStats: user.skillStats ?? { attack: 0, defense: 0, dexterity: 0 },
  buffs: user.buffs ?? [],
  stepsTaken: user.stepsTaken ?? 0,
  totalDamageDealt: user.totalDamageDealt ?? 0,
  totalDamageReceived: user.totalDamageReceived ?? 0,
  totalGoldEarned: user.totalGoldEarned ?? 0,
  inventory: user.inventory ?? [],
  equipment: user.equipment ?? {
    'Weapon': null,
    'Head Wear': null,
    'Body Armor': null,
    'Pants': null,
  },
});

const getUserId = (res: express.Response) => {
  return res.locals.userId as string | undefined;
};

router.use(AuthenticateToken);

router.get('/', async (req, res) => {
  try {
    const primaryConnected = isPrimaryConnected();
    const backupConnected = isBackupConnected();
    if (!primaryConnected && !backupConnected) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    const userId = getUserId(res);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const ActiveUser = getActiveUserModel();
    let user = await ActiveUser.findById(userId);

    if (!user && primaryConnected && backupConnected) {
      const BackupUser = getBackupUserModel();
      if (BackupUser) {
        user = await BackupUser.findById(userId);
      }
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ player: buildPlayerPayload(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', async (req, res) => {
  try {
    const primaryConnected = isPrimaryConnected();
    const backupConnected = isBackupConnected();
    if (!primaryConnected && !backupConnected) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    const userId = getUserId(res);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const body = req.body ?? {};
    const update: Record<string, unknown> = {};

    const numberFields = [
      'level',
      'gold',
      'exp',
      'hp',
      'skillPoints',
      'stepsTaken',
      'totalDamageDealt',
      'totalDamageReceived',
      'totalGoldEarned',
    ];

    numberFields.forEach((field) => {
      if (typeof body[field] === 'number') {
        update[field] = body[field];
      }
    });

    if (body.skillStats && typeof body.skillStats === 'object') {
      update.skillStats = {
        attack: body.skillStats.attack ?? 0,
        defense: body.skillStats.defense ?? 0,
        dexterity: body.skillStats.dexterity ?? 0,
      };
    }

    if (Array.isArray(body.buffs)) {
      update.buffs = body.buffs;
    }

    if (Array.isArray(body.inventory)) {
      update.inventory = body.inventory;
    }

    if (body.equipment && typeof body.equipment === 'object') {
      update.equipment = body.equipment;
    }

    const ActiveUser = getActiveUserModel();
    const user = await ActiveUser.findByIdAndUpdate(
      userId,
      { $set: update },
      { returnDocument: 'after' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (primaryConnected && backupConnected) {
      const BackupUser = getBackupUserModel();
      if (BackupUser) {
        try {
          await BackupUser.findByIdAndUpdate(
            userId,
            { $set: update },
            { returnDocument: 'after', upsert: true }
          );
        } catch (err) {
          console.warn('Backup save failed:', err);
        }
      }
    }

    return res.json({ player: buildPlayerPayload(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
