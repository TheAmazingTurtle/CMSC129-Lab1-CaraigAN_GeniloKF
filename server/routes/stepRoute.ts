import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// Enemy table — mirrors the enemies array in Dashboard.tsx exactly.
// Any changes to enemy stats on the frontend must be reflected here too.
const ENEMIES = [
  { name: "Wild Slime",   hpLoss: 10, goldReward: 15, expReward: 20 },
  { name: "Angry Goblin", hpLoss: 25, goldReward: 40, expReward: 50 },
  { name: "Shadow Bat",   hpLoss: 5,  goldReward: 5,  expReward: 10 },
];

// Experience required to reach the next level.
// Mirrors the expThreshold logic in PlayerContext.tsx — keep in sync.
const expToNextLevel = (level: number): number => level * 100;

// POST /api/game/step
// Processes a single step action server-side and persists the result atomically.
//
// Request body:
//   action: 'walk' | 'fight' | 'skip'
//   enemyIndex?: number  (required when action === 'fight', identifies which enemy was encountered)
//   currentHp: number    (client sends current HP so the server can apply damage on top of it)
//
// Response:
//   outcome: 'walk' | 'encounter' | 'fight' | 'skip'
//   message: string        (human-readable event log line, mirrors Dashboard.tsx lastAction strings)
//   enemy?: { name, hpLoss, goldReward, expReward }  (present when outcome === 'encounter')
//   enemyIndex?: number    (index into ENEMIES, sent back so the client can pass it on fight)
//   updatedStats: { hp, maxHp, gold, exp, level }
const Step = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const { action, enemyIndex, currentHp } = req.body;

    if (!['walk', 'fight', 'skip'].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Hero not found." });

    if (user.hp <= 0) {
      return res.status(400).json({ message: "Your hero is exhausted and cannot move." });
    }

    let message = '';
    let outcomeType: 'walk' | 'encounter' | 'fight' | 'skip' = action as any;
    let encounterPayload: object | undefined = undefined;

    if (action === 'walk') {
      // 20% chance of encounter — mirrors Dashboard.tsx roll < 0.2
      const roll = Math.random();

      if (roll < 0.2) {
        // Encounter — pick a random enemy and return it to the client.
        // Stats are NOT updated yet; the client must follow up with 'fight' or 'skip'.
        const idx = Math.floor(Math.random() * ENEMIES.length);
        const enemy = ENEMIES[idx];
        outcomeType = 'encounter';
        message = `A ${enemy.name} blocks your path!`;
        encounterPayload = { ...enemy, enemyIndex: idx };

        return res.json({
          outcome:  outcomeType,
          message,
          enemy:    encounterPayload,
          updatedStats: {
            hp:    user.hp,
            maxHp: user.maxHp,
            gold:  user.gold,
            exp:   user.exp,
            level: user.level,
          },
        });
      }

      // Safe walk — mirrors Dashboard.tsx goldGained / expGained ranges
      const goldGained = Math.floor(Math.random() * 15) + 10; // 10–24
      const expGained  = Math.floor(Math.random() * 15) + 10; // 10–24
      user.gold += goldGained;
      user.exp  += expGained;
      message = `You walked safely and found ${goldGained} gold.`;
      outcomeType = 'walk';

    } else if (action === 'fight') {
      if (enemyIndex === undefined || enemyIndex < 0 || enemyIndex >= ENEMIES.length) {
        return res.status(400).json({ message: "Invalid enemy." });
      }
      const enemy = ENEMIES[enemyIndex];

      // Apply damage from the fight using the HP the client reported.
      // We trust currentHp from the client here; full server-authoritative HP
      // tracking will be enforced once Stage 4 hydration is complete.
      user.hp   = Math.max(0, (currentHp ?? user.hp) - enemy.hpLoss);
      user.gold += enemy.goldReward;
      user.exp  += enemy.expReward;
      message = `Victory! You defeated the ${enemy.name} but lost ${enemy.hpLoss} HP.`;
      outcomeType = 'fight';

    } else if (action === 'skip') {
      message = `You carefully snuck past the enemy.`;
      outcomeType = 'skip';
    }

    // --- Level-up check ---
    // Keep levelling up while exp meets the threshold (handles multi-level jumps).
    while (user.exp >= expToNextLevel(user.level)) {
      user.exp  -= expToNextLevel(user.level);
      user.level += 1;
      user.maxHp += 20; // Reward each level-up with +20 max HP
      user.hp    = user.maxHp; // Fully restore HP on level-up
    }

    // Atomically persist the updated stats
    user.lastSaved = new Date();
    await user.save();

    res.json({
      outcome: outcomeType,
      message,
      lastSaved: user.lastSaved,
      updatedStats: {
        hp:    user.hp,
        maxHp: user.maxHp,
        gold:  user.gold,
        exp:   user.exp,
        level: user.level,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export default Step;