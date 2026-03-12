import React, { useMemo, useState } from 'react';
import { useItems } from '../../../contexts/ItemContext';
import { usePlayer } from '../../../contexts/PlayerContext';
import type { ItemType } from '../../../contexts/EquipmentContext';
import './Shop.css';
import { getStageForLevel } from '../../../domain/stages';

type Category = ItemType | 'All';

type ShopToast = {
  id: number;
  message: string;
  tone: 'success' | 'error';
};

const categories: Array<{ key: Category; label: string; description: string }> = [
  { key: 'Weapon', label: 'Weapons', description: 'Blades and tools for battle.' },
  { key: 'Head Wear', label: 'Head Wear', description: 'Protect your head on the road.' },
  { key: 'Body Armor', label: 'Body Armor', description: 'Armor up your core.' },
  { key: 'Pants', label: 'Pants', description: 'Greaves and travel pants.' },
  { key: 'Consumable', label: 'Consumables', description: 'Potions and remedies.' },
  { key: 'All', label: 'All Goods', description: 'Browse everything.' },
];

const Shop: React.FC = () => {
  const { itemBank, shopStock, buyItem, getItemValue } = useItems();
  const { gold, level } = usePlayer();
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [sortBy, setSortBy] = useState<'name' | 'rarity'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [toasts, setToasts] = useState<ShopToast[]>([]);
  const [recentlyBoughtId, setRecentlyBoughtId] = useState<number | null>(null);

  const stage = useMemo(() => getStageForLevel(level), [level]);
  const rotationMessage = `${stage.label} (Lv ${stage.minLevel}-${stage.maxLevel})`;

  const stockSource = shopStock.length ? shopStock : itemBank;

  const shopItems = useMemo(() => {
    let result = selectedCategory === 'All'
      ? [...stockSource]
      : stockSource.filter(item => item.type === selectedCategory);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        const rarityWeight: Record<string, number> = {
          Legendary: 5, Epic: 4, Rare: 3, Uncommon: 2, Common: 1
        };
        cmp = (rarityWeight[a.rarity] ?? 0) - (rarityWeight[b.rarity] ?? 0);
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [stockSource, selectedCategory, sortBy, sortAsc]);

  const pushToast = (message: string, tone: ShopToast['tone']) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 2500);
  };

  const handleBuy = (itemId: number) => {
    const item = stockSource.find(entry => entry.id === itemId);
    if (!item) return;

    const cost = getItemValue(item);
    if (gold < cost) {
      pushToast('Not enough gold.', 'error');
      return;
    }

    const success = buyItem(item);
    if (success) {
      pushToast(`Bought ${item.name}.`, 'success');
      setRecentlyBoughtId(item.id);
      window.setTimeout(() => {
        setRecentlyBoughtId((current) => (current === item.id ? null : current));
      }, 1400);
    } else {
      pushToast('Not enough gold.', 'error');
    }
  };

  return (
    <div className="shop-page">
      <div className="shop-card">
        <div className="shop-header">
          <div>
            <h2>Arcade Shop</h2>
            <p>Supplies for the long road.</p>
            <p className="shop-rotation">{rotationMessage}</p>
          </div>
        </div>

        <div className="shop-controls">
          <select
            className="shop-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
          >
            <option value="All">All Types</option>
            <option value="Weapon">Weapons</option>
            <option value="Head Wear">Head Wear</option>
            <option value="Body Armor">Body Armor</option>
            <option value="Pants">Pants</option>
            <option value="Consumable">Consumables</option>
          </select>

          <div className="sort-control">
            <select
              className="shop-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rarity')}
            >
              <option value="name">Sort: Name</option>
              <option value="rarity">Sort: Rarity</option>
            </select>
            <button
              className="sort-dir-btn"
              onClick={() => setSortAsc(a => !a)}
              title={sortAsc ? 'Ascending' : 'Descending'}
              aria-label="Toggle sort direction"
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div className="list-panel">
          <div className="list-header">
            <span>Name</span>
            <span>Type</span>
            <span>Rarity</span>
            <span>Stat</span>
            <span>Price</span>
          </div>
          <div className="list-scroll">
          {shopItems.map(item => {
            const cost = getItemValue(item);
            const cannotAfford = gold < cost;
            const isBought = recentlyBoughtId === item.id;

            return (
              <div
                key={item.id}
                className={`list-row buy-row ${cannotAfford ? 'disabled' : ''} ${isBought ? 'bought' : ''}`}
                onClick={() => {
                  if (cannotAfford) {
                    pushToast('Not enough gold.', 'error');
                    return;
                  }
                  handleBuy(item.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  if (cannotAfford) {
                    pushToast('Not enough gold.', 'error');
                    return;
                  }
                  handleBuy(item.id);
                }}
              >
                <strong>{item.name}</strong>
                <span style={{ textAlign: 'center' }}>{item.type}</span>
                <span style={{ textAlign: 'center' }} className={`rarity ${item.rarity.toLowerCase()}`}>{item.rarity}</span>
                <span style={{ textAlign: 'center' }} className="muted">{item.stat}</span>
                <span style={{ textAlign: 'center' }} className="price">{cost}g</span>
              </div>
            );
          })}
          {shopItems.length === 0 && (
            <div className="empty-message">No items in this category.</div>
          )}
          </div>
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="shop-toast-stack" role="status">
          {toasts.slice(-4).map((toast, index, array) => {
            const visualIndex = array.length - 1 - index;
            return (
              <div
                key={toast.id}
                className={`shop-toast ${toast.tone}`}
                style={{
                  transform: `translateY(${-visualIndex * 18}px) scale(${Math.max(0.82, 1 - visualIndex * 0.08)})`,
                  opacity: Math.max(0.5, 1 - visualIndex * 0.18),
                }}
              >
                {toast.message}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shop;