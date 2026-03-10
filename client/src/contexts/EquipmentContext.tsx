import React, { createContext, useContext, useState } from 'react';
import type { StatBlock } from './types';

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
  bonuses?: Partial<StatBlock>;
  effects?: {
    heal?: number;
    tempBuff?: {
      name: string;
      bonuses: Partial<StatBlock>;
      durationSteps: number;
    };
  };
}

interface EquipmentContextType {
  equipment: Record<EquipmentSlot, Item | null>;
  equipItem: (item: Item) => void;
  unequipItem: (slot: EquipmentSlot) => void;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipment, setEquipment] = useState<Record<EquipmentSlot, Item | null>>({
    'Weapon': null,
    'Head Wear': null,
    'Body Armor': null,
    'Pants': null,
  });

  const equipItem = (item: Item) => {
    if (item.type === 'Consumable') return;
    setEquipment(prev => ({ ...prev, [item.type]: item }));
  };

  const unequipItem = (slot: EquipmentSlot) => {
    setEquipment(prev => ({ ...prev, [slot]: null }));
  };

  return (
    <EquipmentContext.Provider value={{ equipment, equipItem, unequipItem }}>
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) throw new Error('useEquipment must be used within EquipmentProvider');
  return context;
};
