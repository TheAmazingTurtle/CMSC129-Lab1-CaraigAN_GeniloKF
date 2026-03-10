import React, { useState, useMemo, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import type { Item, EquipmentSlot, ItemType, Rarity } from '../../contexts/PlayerContext.tsx';
import './Inventory.css';

// NOTE: Item, EquipmentSlot, ItemType, Rarity are exported from PlayerContext.tsx
// as the single source of truth. The Mongoose schema in User.ts mirrors them exactly.

const ITEMS_PER_PAGE = 5;

const Inventory: React.FC = () => {
  const {
    inventory, setInventory,
    equippedItems, setEquippedItems,
    savePlayerState,
  } = usePlayer();

  const equipped = equippedItems as Record<EquipmentSlot, Item | null>;

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [saveStatus, setSaveStatus]     = useState<string>('');
  const [filterType, setFilterType]     = useState<ItemType | 'All'>('All');
  const [sortBy, setSortBy]             = useState<'level' | 'rarity'>('level');
  const [currentPage, setCurrentPage]   = useState(1);

  const flashSaveStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const processedItems = useMemo(() => {
    let result = [...inventory];
    if (filterType !== 'All') {
      result = result.filter(item => item.type === filterType);
    }
    result.sort((a, b) => {
      if (sortBy === 'level') return b.level - a.level;
      const rarityWeight: Record<Rarity, number> = {
        Legendary: 5, Epic: 4, Rare: 3, Uncommon: 2, Common: 1,
      };
      return rarityWeight[b.rarity] - rarityWeight[a.rarity];
    });
    return result;
  }, [inventory, filterType, sortBy]);

  const totalPages     = Math.ceil(processedItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = processedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const equipItem = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'Consumable') return;
    const slot = item.type as EquipmentSlot;
    const currentlyEquipped = equipped[slot];

    setEquippedItems(prev => ({ ...prev, [slot]: item }));
    setInventory(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return currentlyEquipped ? [...filtered, currentlyEquipped] : filtered;
    });

    const result = await savePlayerState();
    flashSaveStatus(result ? '✓ Equipped & saved' : '⚠ Equip saved locally only');
  };

  const unequipItem = async (slot: EquipmentSlot) => {
    const item = equipped[slot];
    if (!item) return;

    setInventory(prev => [...prev, item]);
    setEquippedItems(prev => ({ ...prev, [slot]: null }));

    const result = await savePlayerState();
    flashSaveStatus(result ? '✓ Unequipped & saved' : '⚠ Unequip saved locally only');
  };

  const useItem = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`You used: ${item.name}!`);

    setInventory(prev => prev.filter(i => i.id !== item.id));
    if (selectedItem?.id === item.id) setSelectedItem(null);

    const result = await savePlayerState();
    flashSaveStatus(result ? '✓ Item used & saved' : '⚠ Item use saved locally only');
  };

  return (
    <div className="inventory-page">
      {saveStatus && (
        <div style={{
          position: 'fixed', bottom: '4rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg, #1a1a2e)', border: '1px solid #444',
          padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.85rem',
          color: '#ccc', zIndex: 999, pointerEvents: 'none',
        }}>
          {saveStatus}
        </div>
      )}

      {/* LEFT PANEL */}
      <div className="equipment-section">
        <h2>Character</h2>
        <div className="equip-grid">
          {(Object.keys(equipped) as EquipmentSlot[]).map(slot => (
            <div key={slot} className="equip-slot">
              <div className="equip-slot-label">{slot}</div>
              {equipped[slot] ? (
                <div>
                  <strong>{equipped[slot]?.name}</strong>
                  <div className="stat-text">{equipped[slot]?.stat}</div>
                  <button onClick={() => unequipItem(slot)} style={{ marginTop: '0.5rem' }}>
                    Unequip
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--border-color)', fontStyle: 'italic' }}>Empty Slot</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="inventory-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Satchel</h2>
          <div className="inventory-controls">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as ItemType | 'All')}>
              <option value="All">All Types</option>
              <option value="Weapon">Weapons</option>
              <option value="Head Wear">Head Wear</option>
              <option value="Body Armor">Body Armor</option>
              <option value="Pants">Pants</option>
              <option value="Consumable">Consumables</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'level' | 'rarity')}>
              <option value="level">Sort: Lvl</option>
              <option value="rarity">Sort: Rarity</option>
            </select>
          </div>
        </div>

        <div className="inventory-list">
          <div className="list-header">
            <div style={{ flex: 1.5, textAlign: 'left' }}>Item Name</div>
            <div style={{ flex: 1 }}>Type</div>
            <div style={{ flex: 1 }}>Lvl</div>
            <div style={{ flex: 1 }}>Rarity</div>
            <div style={{ flex: 1 }}>Stat</div>
            <div style={{ flex: 1 }}>Action</div>
          </div>

          <div className="items-container">
            {paginatedItems.map(item => (
              <div key={item.id} className="inventory-row" onClick={() => setSelectedItem(item)}>
                <div style={{ flex: 1.5, fontWeight: 'bold', textAlign: 'left' }}>{item.name}</div>
                <div style={{ flex: 1, color: 'var(--text-muted)' }}>{item.type}</div>
                <div style={{ flex: 1 }}>{item.level}</div>
                <div style={{ flex: 1, color: `var(--${item.rarity.toLowerCase()})` }}>{item.rarity}</div>
                <div style={{ flex: 1 }} className="stat-text">{item.stat}</div>
                <div style={{ flex: 1 }}>
                  {item.type === 'Consumable' ? (
                    <button onClick={(e) => useItem(item, e)}>Use</button>
                  ) : (
                    <button onClick={(e) => equipItem(item, e)}>Equip</button>
                  )}
                </div>
              </div>
            ))}
            {paginatedItems.length === 0 && (
              <div className="empty-message">No items found.</div>
            )}
          </div>

          <div className="page-nav">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: `var(--${selectedItem.rarity.toLowerCase()})` }}>{selectedItem.name}</h2>
            <p className="flavor-text">"{selectedItem.flavorText}"</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>{selectedItem.type}</span>
              <span>{selectedItem.rarity}</span>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              style={{ marginTop: '2rem', width: '100%', padding: '0.8rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;