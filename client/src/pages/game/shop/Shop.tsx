import React, { useMemo, useState } from 'react';
import { useItems } from '../../../contexts/ItemContext';
import { usePlayer } from '../../../contexts/PlayerContext';
import type { ItemType } from '../../../contexts/EquipmentContext';
import './Shop.css';

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
  const { itemBank, buyItem, getItemValue, inventory, sellItem } = useItems();
  const { gold } = usePlayer();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Weapon');
  const [toasts, setToasts] = useState<ShopToast[]>([]);
  const [recentlyBoughtId, setRecentlyBoughtId] = useState<number | null>(null);

  const shopItems = useMemo(() => {
    if (selectedCategory === 'All') return itemBank;
    return itemBank.filter(item => item.type === selectedCategory);
  }, [itemBank, selectedCategory]);

  const pushToast = (message: string, tone: ShopToast['tone']) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 2500);
  };

  const handleBuy = (itemId: number) => {
    const item = itemBank.find(entry => entry.id === itemId);
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
          </div>
          <div className="shop-tabs">
            <button
              className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
              onClick={() => setActiveTab('buy')}
            >
              Buy
            </button>
            <button
              className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
              onClick={() => setActiveTab('sell')}
            >
              Sell
            </button>
          </div>
        </div>

        {activeTab === 'buy' ? (
          <>
            <div className="category-grid">
              {categories.map(category => (
                <button
                  key={category.key}
                  className={`category-card ${selectedCategory === category.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.key)}
                >
                  <strong>{category.label}</strong>
                  <span>{category.description}</span>
                </button>
              ))}
            </div>

            <div className="list-panel">
              <div className="list-header">
                <span>Name</span>
                <span>Type</span>
                <span>Rarity</span>
                <span>Stat</span>
                <span>Price</span>
                <span></span>
              </div>
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
                    <span style={{textAlign: 'center'}}>{item.type}</span>
                    <span style={{textAlign: 'center'}} className={`rarity ${item.rarity.toLowerCase()}`}>{item.rarity}</span>
                    <span style={{textAlign: 'center'}} className="muted">{item.stat}</span>
                    <span style={{textAlign: 'center'}} className="price">{cost} gold</span>
                  </div>
                );
              })}
              {shopItems.length === 0 && (
                <div className="empty-message">No items in this category.</div>
              )}
            </div>
          </>
        ) : (
          <div className="list-panel">
            <div className="list-header">
              <span>Name</span>
              <span>Type</span>
              <span>Rarity</span>
              <span>Stat</span>
              <span>Price</span>
              <span></span>
            </div>
            {inventory.map(item => (
              <div key={item.id} className="list-row">
                <strong>{item.name}</strong>
                <span>{item.type}</span>
                <span className={`rarity ${item.rarity.toLowerCase()}`}>{item.rarity}</span>
                <span className="muted">{item.stat}</span>
                <span className="price">{getItemValue(item)} gold</span>
                <button onClick={() => sellItem(item)}>Sell</button>
              </div>
            ))}
            {inventory.length === 0 && (
              <div className="empty-message">No items to sell.</div>
            )}
          </div>
        )}
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
