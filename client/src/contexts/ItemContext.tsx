import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Item } from './EquipmentContext';
import { usePlayer } from './PlayerContext';
import { itemBank, defaultStartingItems, getItemValue as calcItemValue } from '../domain/items';
import { rollForLoot } from '../services/loot';
import { buildShopStock, getShopRotationKey } from '../domain/shop';

interface ItemContextType {
  inventory: Item[];
  itemBank: Item[];
  shopStock: Item[];
  shopRotationKey: string;
  addItem: (item: Item) => void;
  removeItem: (id: number) => void;
  sellItem: (item: Item) => void;
  buyItem: (item: Item) => boolean;
  getItemValue: (item: Item) => number;
  rollForLoot: () => Item | null;
  hydrateInventory: (items: Item[]) => void;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const ItemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addGold, spendGold, gold, dexterity, level } = usePlayer();
  const [inventory, setInventory] = useState<Item[]>(defaultStartingItems);
  const [shopRotationKey, setShopRotationKey] = useState(getShopRotationKey());
  const [shopStock, setShopStock] = useState<Item[]>(() => buildShopStock(itemBank, getShopRotationKey()));

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextKey = getShopRotationKey();
      if (nextKey !== shopRotationKey) {
        setShopRotationKey(nextKey);
        setShopStock(buildShopStock(itemBank, nextKey));
      }
    }, 60000);

    return () => window.clearInterval(interval);
  }, [shopRotationKey]);

  const addItem = (item: Item) => setInventory(prev => [...prev, item]);
  const removeItem = (id: number) => setInventory(prev => prev.filter(i => i.id !== id));

  const sellItem = (item: Item) => {
    addGold(calcItemValue(item));
    removeItem(item.id);
  };

  const buyItem = (item: Item) => {
    const cost = calcItemValue(item);
    if (gold < cost) return false;
    spendGold(cost);
    addItem({ ...item, id: Date.now() + Math.floor(Math.random() * 1000) });
    return true;
  };

  const hydrateInventory = (items: Item[]) => {
    if (!Array.isArray(items)) return;
    setInventory(items);
  };

  const value = useMemo(() => ({
    inventory,
    itemBank,
    shopStock,
    shopRotationKey,
    addItem,
    removeItem,
    sellItem,
    buyItem,
    getItemValue: calcItemValue,
    rollForLoot: () => rollForLoot(itemBank, { luck: dexterity, level }),
    hydrateInventory,
  }), [inventory, gold, dexterity, level, shopStock, shopRotationKey]);

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
