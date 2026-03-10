import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// POST /api/game/save
// Accepts the current game state from the client and persists it to MongoDB.
// Uses $set so only the provided fields are updated — no full document replacement.
// Called on manual save (Stage 6) and on milestone auto-saves (Stage 5).
const Save = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const { hp, maxHp, gold, exp, level, inventory, equippedItems } = req.body;

    // Validate that the required fields are present before writing
    if (
      hp === undefined || maxHp === undefined ||
      gold === undefined || exp === undefined || level === undefined
    ) {
      return res.status(400).json({ message: "Incomplete game state." });
    }

    const now = new Date();

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          hp,
          maxHp,
          gold,
          exp,
          level,
          inventory:     inventory     ?? [],
          equippedItems: equippedItems ?? {
            'Weapon': null, 'Head Wear': null, 'Body Armor': null, 'Pants': null,
          },
          lastSaved: now,
        },
      },
      { runValidators: true } // Enforce schema enum rules on inventory items
    );

    res.json({ message: "Progress saved.", lastSaved: now });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export default Save;