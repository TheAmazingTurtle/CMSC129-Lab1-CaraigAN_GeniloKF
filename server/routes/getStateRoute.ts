import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// GET /api/game/state
// Returns the full game state for the authenticated player.
// Called on login to hydrate PlayerContext (Stage 4).
const GetState = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    // Exclude password from the response — never send it to the client
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: "Hero not found." });

    res.json({
      hp:            user.hp,
      maxHp:         user.maxHp,
      gold:          user.gold,
      exp:           user.exp,
      level:         user.level,
      inventory:     user.inventory,
      equippedItems: user.equippedItems,
      lastSaved:     user.lastSaved,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export default GetState;