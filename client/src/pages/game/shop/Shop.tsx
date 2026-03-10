import React, { useMemo, useState } from 'react';
import { useItems } from '../../../contexts/ItemContext';
import type { ItemType } from '../../../contexts/EquipmentContext';
import './Shop.css';

type Category = ItemType | 'All';

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
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Weapon');

  const shopItems = useMemo(() => {
    if (selectedCategory === 'All') return itemBank;
    return itemBank.filter(item => item.type === selectedCategory);
  }, [itemBank, selectedCategory]);

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
              {shopItems.map(item => (
                <div key={item.id} className="list-row">
                  <strong>{item.name}</strong>
                  <span>{item.type}</span>
                  <span className={`rarity ${item.rarity.toLowerCase()}`}>{item.rarity}</span>
                  <span className="muted">{item.stat}</span>
                  <span className="price">{getItemValue(item)} gold</span>
                  <button onClick={() => buyItem(item)}>Buy</button>
                </div>
              ))}
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
    </div>
  );
};

export default Shop;
