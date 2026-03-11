import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Item } from './EquipmentContext';
import { usePlayer } from './PlayerContext';
import { itemBank, defaultStartingItems, getItemValue as calcItemValue } from '../domain/items';
import { rollForLoot } from '../services/loot';

interface ItemContextType {
  inventory: Item[];
  itemBank: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: number) => void;
  sellItem: (item: Item) => void;
  buyItem: (item: Item) => void;
  getItemValue: (item: Item) => number;
  rollForLoot: () => Item | null;
  hydrateInventory: (items: Item[]) => void;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const ItemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addGold, spendGold } = usePlayer();
  const [inventory, setInventory] = useState<Item[]>(defaultStartingItems);

  const addItem = (item: Item) => setInventory(prev => [...prev, item]);
  const removeItem = (id: number) => setInventory(prev => prev.filter(i => i.id !== id));

  const sellItem = (item: Item) => {
    addGold(calcItemValue(item));
    removeItem(item.id);
  };

  const buyItem = (item: Item) => {
    const cost = calcItemValue(item);
    spendGold(cost);
    addItem({ ...item, id: Date.now() + Math.floor(Math.random() * 1000) });
  };

  const hydrateInventory = (items: Item[]) => {
    if (!Array.isArray(items)) return;
    setInventory(items);
  };

  const value = useMemo(() => ({
    inventory,
    itemBank,
    addItem,
    removeItem,
    sellItem,
    buyItem,
    getItemValue: calcItemValue,
    rollForLoot: () => rollForLoot(itemBank),
    hydrateInventory,
  }), [inventory]);

  return (
    <ItemContext.Provider value={value}>
      {children}
    </ItemContext.Provider>
  );
};

export const useItems = () => {
  const context = useContext(ItemContext);
  if (!context) throw new Error('useItems must be used within ItemProvider');
  return context;
};
