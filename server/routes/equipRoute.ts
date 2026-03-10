import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// POST /api/game/equip
// Performs equip and unequip atomically on the server document.
// Avoids the client-side setState → savePlayerState stale-ref race condition.
//
// Request body:
//   action: 'equip' | 'unequip'
//   inventoryIndex?: number   (required for 'equip' — index into user.inventory)
//   slot: EquipmentSlot       (always required — identifies which slot to modify)
//
// Response:
//   inventory:     Item[]
//   equippedItems: Record<EquipmentSlot, Item | null>
//   lastSaved:     Date

const Equip = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const { action, inventoryIndex, slot } = req.body;

    const VALID_SLOTS = ['Weapon', 'Head Wear', 'Body Armor', 'Pants'];
    if (!['equip', 'unequip'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }
    if (!VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ message: 'Invalid equipment slot.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Hero not found.' });

    if (action === 'equip') {
      // inventoryIndex is the item's position in the raw inventory array —
      // sent by the client so the server can splice by index, not by id.
      // This is immune to duplicate items sharing the same id.
      if (inventoryIndex === undefined || inventoryIndex < 0 || inventoryIndex >= user.inventory.length) {
        return res.status(400).json({ message: 'Invalid inventory index.' });
      }

      const itemToEquip = user.inventory[inventoryIndex];

      if (itemToEquip.type === 'Consumable') {
        return res.status(400).json({ message: 'Consumables cannot be equipped.' });
      }
      if (itemToEquip.type !== slot) {
        return res.status(400).json({ message: `Item does not fit the ${slot} slot.` });
      }

      // If a different item is already in the slot, return it to inventory first.
      const currentlyEquipped = user.equippedItems?.[slot as keyof typeof user.equippedItems];
      if (currentlyEquipped) {
        user.inventory.push(currentlyEquipped as any);
      }

      // Remove the item being equipped from inventory by index — safe for duplicates.
      user.inventory.splice(inventoryIndex, 1);

      // Place into the slot.
      (user.equippedItems as any)[slot] = itemToEquip;

    } else {
      // action === 'unequip'
      const currentlyEquipped = user.equippedItems?.[slot as keyof typeof user.equippedItems];
      if (!currentlyEquipped) {
        return res.status(400).json({ message: 'No item equipped in that slot.' });
      }

      // Return item to inventory then clear the slot.
      user.inventory.push(currentlyEquipped as any);
      (user.equippedItems as any)[slot] = null;
    }

    user.lastSaved = new Date();
    // markModified is required because equippedItems is a nested schema —
    // Mongoose won't detect the mutation otherwise and won't persist it.
    user.markModified('equippedItems');
    await user.save();

    res.json({
      inventory:     user.inventory,
      equippedItems: user.equippedItems,
      lastSaved:     user.lastSaved,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

export default Equip;