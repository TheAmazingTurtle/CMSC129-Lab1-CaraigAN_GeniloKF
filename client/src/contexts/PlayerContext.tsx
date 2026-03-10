import React, { createContext, useContext, useState, useCallback } from 'react';

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
  addGold: (amount: number) => void;
  spendGold: (amount: number) => void;
  regenHP: (amount: number) => void;
  takeDamage: (amount: number) => void;
  gainExp: (amount: number) => void;
  levelUp: () => void;
  // Fetches the player's saved state from the API and hydrates context.
  // Called by Login and Signup immediately after storing the JWT.
  loadPlayerState: () => Promise<void>;
  // Overwrites context state with a pre-fetched stats object.
  // Used by Dashboard (Stage 5) when stepRoute returns updatedStats.
  applyServerStats: (stats: {
    hp: number; maxHp: number; gold: number; exp: number; level: number;
  }) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// expThreshold formula — must match expToNextLevel() in stepRoute.ts exactly.
// If you change this, update the server too.
const calcExpThreshold = (level: number): number => level * 100;

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

    // Derived — always computed from level, never stored separately.
    const expThreshold = calcExpThreshold(level);

    // --- Fetch saved state from the API and hydrate context ---
    // This replaces the hardcoded defaults on login/signup.
    const loadPlayerState = useCallback(async () => {
      const token = localStorage.getItem('game_token');
      if (!token) return;

      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/game/state', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          // Token may be expired — clear it and let ProtectedRoute redirect
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
        // skillPoints, attack, defense, dexterity are not yet persisted (Stage 2 scope).
        // They stay at their defaults until a future schema extension covers them.
      } catch (err) {
        console.error("Failed to load player state:", err);
      } finally {
        setIsLoading(false);
      }
    }, []);

    // --- Apply stats returned directly from stepRoute's updatedStats ---
    // Avoids a second round-trip fetch after every step.
    const applyServerStats = useCallback((stats: {
      hp: number; maxHp: number; gold: number; exp: number; level: number;
    }) => {
      setHp(stats.hp);
      setMaxHp(stats.maxHp);
      setGold(stats.gold);
      setExp(stats.exp);
      setLevel(stats.level);
    }, []);

    const addGold  = (amount: number) => setGold(prev => prev + amount);
    const spendGold = (amount: number) => setGold(prev => Math.max(0, prev - amount));
    const takeDamage = (amount: number) => setHp(prev => Math.max(0, prev - amount));
    const regenHP  = (amount: number) => setHp(prev => Math.min(maxHp, prev + amount));

    // gainExp is kept for local-only flows. For step results from the API,
    // applyServerStats is used instead (no risk of formula mismatch).
    // Uses a single synchronous calculation then calls each setter once.
    const gainExp = (amount: number) => {
        // Read current values synchronously inside the updater to avoid stale closures
        setExp(prevExp => {
            let newExp = prevExp + amount;
            let levelsGained = 0;
            let newMaxHp = 0; // calculated below with setLevel read

            // Count how many level-ups this exp triggers
            let tempLevel = level; // 'level' from closure is fine here (read-only check)
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
                    setHp(updated); // Full restore on level-up
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
        setHp(prev => prev + 20); // match server: full maxHp restore simplified to +20 here
    };

    return (
        <PlayerContext.Provider value={{
          gold, exp, expThreshold, hp, maxHp,
          skillPoints, attack, defense, dexterity, level,
          isLoading,
          addGold, spendGold, regenHP, takeDamage, gainExp, levelUp,
          loadPlayerState, applyServerStats,
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