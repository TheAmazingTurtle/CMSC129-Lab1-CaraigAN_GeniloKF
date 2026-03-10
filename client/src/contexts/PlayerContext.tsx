import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

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
  // Spends gold, saves to DB, and updates the lastSaved timestamp.
  // Use this instead of spendGold wherever a gold-spend is a save milestone.
  spendGoldAndSave: (amount: number) => Promise<void>;
  regenHP: (amount: number) => void;
  takeDamage: (amount: number) => void;
  gainExp: (amount: number) => void;
  levelUp: () => void;
  setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
  setEquippedItems: React.Dispatch<React.SetStateAction<Record<EquipmentSlot, Item | null>>>;
  // Exposes the lastSaved setter so Dashboard can stamp the timestamp
  // returned directly by stepRoute without a redundant savePlayerState call.
  setLastSaved: React.Dispatch<React.SetStateAction<Date | null>>;
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

    // Refs mirror every piece of state that savePlayerState needs to send.
    // Unlike the useCallback dependency array, refs are always current —
    // this means savePlayerState never captures stale values even when called
    // immediately after a setState (e.g. equip/unequip/use in Inventory.tsx).
    const stateRef = useRef({ hp: 100, maxHp: 100, gold: 0, exp: 0, level: 1, inventory: [] as Item[], equippedItems: EMPTY_EQUIPPED });

    useEffect(() => { stateRef.current.hp           = hp;           }, [hp]);
    useEffect(() => { stateRef.current.maxHp        = maxHp;        }, [maxHp]);
    useEffect(() => { stateRef.current.gold         = gold;         }, [gold]);
    useEffect(() => { stateRef.current.exp          = exp;          }, [exp]);
    useEffect(() => { stateRef.current.level        = level;        }, [level]);
    useEffect(() => { stateRef.current.inventory    = inventory;    }, [inventory]);
    useEffect(() => { stateRef.current.equippedItems = equippedItems; }, [equippedItems]);

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

    // Reads the latest state via stateRef (not the closure) so it is safe to call
    // immediately after setState — no stale inventory or equippedItems ever get sent.
    const savePlayerState = useCallback(async (): Promise<{ lastSaved: Date } | null> => {
      const token = localStorage.getItem('game_token');
      if (!token) return null;

      try {
        const snap = stateRef.current;
        const res = await fetch('http://localhost:5000/api/game/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            hp:            snap.hp,
            maxHp:         snap.maxHp,
            gold:          snap.gold,
            exp:           snap.exp,
            level:         snap.level,
            inventory:     snap.inventory,
            equippedItems: snap.equippedItems,
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
    }, []); // No deps needed — always reads from stateRef

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

    // Async version for gold-spend milestones — deducts gold, saves, stamps timestamp.
    const spendGoldAndSave = async (amount: number) => {
      setGold(prev => Math.max(0, prev - amount));
      await savePlayerState();
    };
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
          addGold, spendGold, spendGoldAndSave, regenHP, takeDamage, gainExp, levelUp,
          setInventory, setEquippedItems, setLastSaved,
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