export type AuthResponse = {
  token: string;
  user?: {
    id: string;
    email: string;
  };
};

export type MeResponse = {
  user: {
    id: string;
  };
};

export type PlayerResponse = {
  player: {
    level: number;
    gold: number;
    exp: number;
    hp: number;
    skillPoints: number;
    skillStats: {
      attack: number;
      defense: number;
      dexterity: number;
    };
    buffs: Array<{
      id: string;
      name: string;
      remainingSteps: number;
      bonuses: {
        attack?: number;
        defense?: number;
        dexterity?: number;
      };
    }>;
    stepsTaken: number;
    totalDamageDealt: number;
    totalDamageReceived: number;
    totalGoldEarned: number;
    totalEnemiesDefeated: number;
    inventory: Array<Record<string, unknown>>;
    equipment: Record<string, unknown>;
  };
};
