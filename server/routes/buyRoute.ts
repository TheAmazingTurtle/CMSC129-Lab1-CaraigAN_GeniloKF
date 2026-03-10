import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// Shop catalogue — single source of truth for all buyable items.
// tier gates which levels can see the item (inclusive).
// repeatable: true means the player can buy it multiple times (consumables).
// buyPrice is set here; sell price is governed by sellRoute's formula.
export interface ShopItem {
  id:         number;
  name:       string;
  type:       string;
  level:      number;
  rarity:     string;
  stat:       string;
  flavorText: string;
  buyPrice:   number;
  repeatable: boolean;
  minLevel:   number; // player level required to see this item
}

export const SHOP_CATALOGUE: ShopItem[] = [
  // ---------- Tier 1 (player level 1+) ----------
  {
    id: 301, name: "Health Potion",       type: "Consumable", level: 1, rarity: "Common",
    stat: "+50 HP",         flavorText: "A reliable swig of crimson remedy.",
    buyPrice: 30,  repeatable: true,  minLevel: 1,
  },
  {
    id: 302, name: "Traveller's Tunic",   type: "Body Armor", level: 1, rarity: "Common",
    stat: "+3 DEF",         flavorText: "Worn by a thousand wanderers before you.",
    buyPrice: 40,  repeatable: false, minLevel: 1,
  },
  {
    id: 303, name: "Wooden Club",         type: "Weapon",     level: 1, rarity: "Common",
    stat: "+3 ATK",         flavorText: "A lump of oak with attitude.",
    buyPrice: 40,  repeatable: false, minLevel: 1,
  },
  {
    id: 304, name: "Frayed Cap",          type: "Head Wear",  level: 1, rarity: "Common",
    stat: "+2 DEF",         flavorText: "It keeps the rain out. Mostly.",
    buyPrice: 25,  repeatable: false, minLevel: 1,
  },
  {
    id: 305, name: "Rough-Spun Trousers", type: "Pants",      level: 1, rarity: "Common",
    stat: "+2 DEF",         flavorText: "Itchy, but better than nothing.",
    buyPrice: 25,  repeatable: false, minLevel: 1,
  },

  // ---------- Tier 2 (player level 5+) ----------
  {
    id: 306, name: "Greater Health Potion", type: "Consumable", level: 3, rarity: "Uncommon",
    stat: "+120 HP",        flavorText: "Smells like berries and good decisions.",
    buyPrice: 80,  repeatable: true,  minLevel: 5,
  },
  {
    id: 307, name: "Chainmail Vest",       type: "Body Armor", level: 4, rarity: "Uncommon",
    stat: "+10 DEF",        flavorText: "Every ring a promise of survival.",
    buyPrice: 150, repeatable: false, minLevel: 5,
  },
  {
    id: 308, name: "Iron Sword",           type: "Weapon",     level: 4, rarity: "Uncommon",
    stat: "+9 ATK",         flavorText: "Reliable. Honest. Occasionally brutal.",
    buyPrice: 150, repeatable: false, minLevel: 5,
  },
  {
    id: 309, name: "Scout's Hood",         type: "Head Wear",  level: 3, rarity: "Uncommon",
    stat: "+5 DEF, +1 DEX", flavorText: "Shadows like you when you wear this.",
    buyPrice: 100, repeatable: false, minLevel: 5,
  },
  {
    id: 310, name: "Reinforced Leggings",  type: "Pants",      level: 4, rarity: "Uncommon",
    stat: "+7 DEF",         flavorText: "Stops most things below the waist.",
    buyPrice: 100, repeatable: false, minLevel: 5,
  },

  // ---------- Tier 3 (player level 10+) ----------
  {
    id: 311, name: "Elixir of Fortitude",  type: "Consumable", level: 5, rarity: "Rare",
    stat: "+250 HP",        flavorText: "One sip and the ground fears your footsteps.",
    buyPrice: 200, repeatable: true,  minLevel: 10,
  },
  {
    id: 312, name: "Plate Cuirass",        type: "Body Armor", level: 6, rarity: "Rare",
    stat: "+18 DEF",        flavorText: "Forged in the fires of a serious craftsman.",
    buyPrice: 400, repeatable: false, minLevel: 10,
  },
  {
    id: 313, name: "Runed Blade",          type: "Weapon",     level: 6, rarity: "Rare",
    stat: "+16 ATK",        flavorText: "The runes hum softly. They hunger.",
    buyPrice: 400, repeatable: false, minLevel: 10,
  },
  {
    id: 314, name: "Warhelm",              type: "Head Wear",  level: 6, rarity: "Rare",
    stat: "+14 DEF",        flavorText: "The visor makes everything look like a battlefield.",
    buyPrice: 300, repeatable: false, minLevel: 10,
  },
  {
    id: 315, name: "Greatplate Greaves",   type: "Pants",      level: 6, rarity: "Rare",
    stat: "+12 DEF",        flavorText: "Your stride now echoes three seconds later.",
    buyPrice: 300, repeatable: false, minLevel: 10,
  },
];

// POST /api/game/buy
// Validates the player has enough gold, deducts it, pushes the item to inventory,
// and persists atomically. Returns updated inventory, gold, and lastSaved.
//
// Request body:
//   itemId: number   (matches ShopItem.id in SHOP_CATALOGUE)
//
// Response:
//   inventory: Item[]
//   gold:      number
//   lastSaved: Date
const Buy = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const { itemId } = req.body;
    const shopItem = SHOP_CATALOGUE.find(i => i.id === itemId);
    if (!shopItem) return res.status(400).json({ message: 'Item not found in shop.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Hero not found.' });

    // Level gate — prevent buying items the shop shouldn't show yet
    if (user.level < shopItem.minLevel) {
      return res.status(403).json({ message: `Requires level ${shopItem.minLevel}.` });
    }

    // For non-repeatable gear, block buying a second copy if already owned or equipped
    if (!shopItem.repeatable) {
      const alreadyInInventory = user.inventory.some(i => i.id === shopItem.id);
      const alreadyEquipped    = Object.values(user.equippedItems ?? {})
        .some((e: any) => e?.id === shopItem.id);
      if (alreadyInInventory || alreadyEquipped) {
        return res.status(400).json({ message: 'You already own this item.' });
      }
    }

    if (user.gold < shopItem.buyPrice) {
      return res.status(400).json({ message: 'Not enough gold.' });
    }

    // Deduct gold and push item — { tier, repeatable, buyPrice, minLevel } are
    // shop-only fields; strip them before pushing to the inventory schema.
    const { buyPrice: _bp, repeatable: _r, minLevel: _ml, ...inventoryItem } = shopItem;
    user.gold -= shopItem.buyPrice;
    user.inventory.push(inventoryItem as any);
    user.lastSaved = new Date();
    await user.save();

    res.json({
      inventory: user.inventory,
      gold:      user.gold,
      lastSaved: user.lastSaved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

export default Buy;