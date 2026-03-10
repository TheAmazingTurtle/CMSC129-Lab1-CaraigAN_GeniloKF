import React, { createContext, useContext, useState, useCallback } from 'react';

// --- Inventory types (source of truth — mirrors User.ts schemas) ---
export type EquipmentSlot = 'Weapon' | 'Head Wear' | 'Body Armor' | 'Pants';
export type ItemType = EquipmentSlot | 'Consumable';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  level: number;
  rarity: Rarity;
  stat: string;
  flavorText: string;
}

interface PlayerContextType {
  gold: number;
  exp: number;
  expThreshold: number;
  hp: number;
  maxHp: number;
  skillPoints: number;
  attack: number;
  defense: number;
  dexterity: number;
  level: number;
  isLoading: boolean;
  inventory: Item[];
  equippedItems: Record<EquipmentSlot, Item | null>;
  lastSaved: Date | null;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => void;
  regenHP: (amount: number) => void;
  takeDamage: (amount: number) => void;
  gainExp: (amount: number) => void;
  levelUp: () => void;
  setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
  setEquippedItems: React.Dispatch<React.SetStateAction<Record<EquipmentSlot, Item | null>>>;
  loadPlayerState: () => Promise<void>;
  applyServerStats: (stats: {
    hp: number; maxHp: number; gold: number; exp: number; level: number;
  }) => void;
  // Persists the full current game state to the DB.
  // Called on inventory changes (Stage 5) and manual save (Stage 6).
  savePlayerState: () => Promise<{ lastSaved: Date } | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const calcExpThreshold = (level: number): number => level * 100;

const EMPTY_EQUIPPED: Record<EquipmentSlot, Item | null> = {
  'Weapon': null, 'Head Wear': null, 'Body Armor': null, 'Pants': null,
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gold, setGold]           = useState(0);
    const [hp, setHp]               = useState(100);
    const [maxHp, setMaxHp]         = useState(100);
    const [exp, setExp]             = useState(0);
    const [level, setLevel]         = useState(1);
    const [skillPoints, setSkillPoints] = useState(0);
    const [attack, setAttack]       = useState(5);
    const [defense, setDefense]     = useState(5);
    const [dexterity, setDexterity] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<Item[]>([]);
    const [equippedItems, setEquippedItems] = useState<Record<EquipmentSlot, Item | null>>(EMPTY_EQUIPPED);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const expThreshold = calcExpThreshold(level);

    const loadPlayerState = useCallback(async () => {
      const token = localStorage.getItem('game_token');
      if (!token) return;

      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/game/state', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('game_token');
          }
          return;
        }

        const data = await res.json();
        setHp(data.hp);
        setMaxHp(data.maxHp);
        setGold(data.gold);
        setExp(data.exp);
        setLevel(data.level);
        setInventory(data.inventory ?? []);
        setEquippedItems(data.equippedItems ?? EMPTY_EQUIPPED);
        setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null);
      } catch (err) {
        console.error("Failed to load player state:", err);
      } finally {
        setIsLoading(false);
      }
    }, []);

    // Reads current state values via a functional pattern and POSTs to /api/game/save.
    // Returns the server's lastSaved timestamp on success, or null on failure.
    const savePlayerState = useCallback(async (): Promise<{ lastSaved: Date } | null> => {
      const token = localStorage.getItem('game_token');
      if (!token) return null;

      // Capture current values at call time via ref-like approach
      // by passing them directly — callers should await this after their state setters.
      try {
        // We need to read state values; since this is useCallback we use
        // a state-reading trick: setX(prev => { capture = prev; return prev })
        // Instead, we pass a snapshot approach — see note below.
        const res = await fetch('http://localhost:5000/api/game/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            hp, maxHp, gold, exp, level, inventory, equippedItems,
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const ts = new Date(data.lastSaved);
        setLastSaved(ts);
        return { lastSaved: ts };
      } catch (err) {
        console.error("Failed to save player state:", err);
        return null;
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hp, maxHp, gold, exp, level, inventory, equippedItems]);

    const applyServerStats = useCallback((stats: {
      hp: number; maxHp: number; gold: number; exp: number; level: number;
    }) => {
      setHp(stats.hp);
      setMaxHp(stats.maxHp);
      setGold(stats.gold);
      setExp(stats.exp);
      setLevel(stats.level);
    }, []);

    const addGold   = (amount: number) => setGold(prev => prev + amount);
    const spendGold = (amount: number) => setGold(prev => Math.max(0, prev - amount));
    const takeDamage = (amount: number) => setHp(prev => Math.max(0, prev - amount));
    const regenHP   = (amount: number) => setHp(prev => Math.min(maxHp, prev + amount));

    const gainExp = (amount: number) => {
        setExp(prevExp => {
            let newExp = prevExp + amount;
            let levelsGained = 0;
            let tempLevel = level;
            while (newExp >= calcExpThreshold(tempLevel)) {
                newExp -= calcExpThreshold(tempLevel);
                tempLevel += 1;
                levelsGained += 1;
            }
            if (levelsGained > 0) {
                setLevel(tempLevel);
                setSkillPoints(prev => prev + levelsGained * 2);
                setMaxHp(prev => {
                    const updated = prev + levelsGained * 20;
                    setHp(updated);
                    return updated;
                });
            }
            return newExp;
        });
    };

    const levelUp = () => {
        setLevel(prev => prev + 1);
        setSkillPoints(prev => prev + 2);
        setMaxHp(prev => prev + 20);
        setHp(prev => prev + 20);
    };

    return (
        <PlayerContext.Provider value={{
          gold, exp, expThreshold, hp, maxHp,
          skillPoints, attack, defense, dexterity, level,
          isLoading, inventory, equippedItems, lastSaved,
          addGold, spendGold, regenHP, takeDamage, gainExp, levelUp,
          setInventory, setEquippedItems,
          loadPlayerState, applyServerStats, savePlayerState,
        }}>
          {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};