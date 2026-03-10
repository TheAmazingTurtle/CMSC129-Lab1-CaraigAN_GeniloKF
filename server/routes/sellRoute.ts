import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// Sell price formula: base * rarityMultiplier
// Balanced against walk gold (10–24), fight gold (5–40), and shop buy prices (Stage D).
const RARITY_SELL_MULTIPLIER: Record<string, number> = {
  Common:    1.0,
  Uncommon:  1.5,
  Rare:      2.5,
  Epic:      4.0,
  Legendary: 7.0,
};

// Base sell price by item level — scales so higher-level drops are worth more.
const baseSellPrice = (itemLevel: number): number => itemLevel * 10;

export const getSellPrice = (itemLevel: number, rarity: string): number => {
  const multiplier = RARITY_SELL_MULTIPLIER[rarity] ?? 1.0;
  return Math.floor(baseSellPrice(itemLevel) * multiplier);
};

// POST /api/game/sell
// Removes an item from inventory by index, credits gold, persists atomically.
//
// Request body:
//   inventoryIndex: number   (index into user.inventory — safe for duplicate items)
//
// Response:
//   inventory: Item[]
//   gold:      number
//   lastSaved: Date
const Sell = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const { inventoryIndex } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Hero not found.' });

    if (
      inventoryIndex === undefined ||
      inventoryIndex < 0 ||
      inventoryIndex >= user.inventory.length
    ) {
      return res.status(400).json({ message: 'Invalid inventory index.' });
    }

    const item = user.inventory[inventoryIndex];
    const goldEarned = getSellPrice(item.level, item.rarity);

    // Remove the item by index — safe for duplicates
    user.inventory.splice(inventoryIndex, 1);
    user.gold += goldEarned;
    user.lastSaved = new Date();

    await user.save();

    res.json({
      inventory: user.inventory,
      gold:      user.gold,
      lastSaved: user.lastSaved,
      goldEarned,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

export default Sell;