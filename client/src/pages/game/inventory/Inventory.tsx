import React, { useMemo, useState, useEffect } from 'react';
import { useEquipment, type EquipmentSlot, type Item, type ItemType, type Rarity } from '../../../contexts/EquipmentContext';
import { useItems } from '../../../contexts/ItemContext';
import { usePlayer } from '../../../contexts/PlayerContext';
import './Inventory.css';

const ITEMS_PER_PAGE = 8;

const itemIcons: Record<ItemType, string> = {
  Weapon: '\u2694\uFE0F',
  'Head Wear': '\uD83E\uDE96',
  'Body Armor': '\uD83D\uDEE1\uFE0F',
  Pants: '\uD83D\uDC56',
  Consumable: '\uD83E\uDDEA',
};

type StatChip = {
  label: string;
  variant: 'positive' | 'negative' | 'neutral';
};

const Inventory: React.FC = () => {
  const { equipment, equipItem, unequipItem } = useEquipment();
  const { inventory, removeItem, addItem } = useItems();
  const { regenHP, addTempBuff } = usePlayer();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // --- Filter & Sort State ---
  const [filterType, setFilterType] = useState<ItemType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'level' | 'rarity'>('level');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Sorting & Filtering Logic ---
  const processedItems = useMemo(() => {
    let result = [...inventory];

    // Filter
    if (filterType !== 'All') {
      result = result.filter(item => item.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'level') return b.level - a.level; // Highest level first
      
      const rarityWeight: Record<Rarity, number> = { 
        Legendary: 5, Epic: 4, Rare: 3, Uncommon: 2, Common: 1 
      };
      return rarityWeight[b.rarity] - rarityWeight[a.rarity]; // Highest rarity first
    });

    return result;
  }, [inventory, filterType, sortBy]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(processedItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = processedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 if filters change and current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const getWeaponDelta = (item: Item): StatChip | null => {
    if (item.type !== 'Weapon') return null;
    const itemAtk = item.bonuses?.attack;
    if (itemAtk == null) return null;

    const equippedWeapon = equipment['Weapon'];
    if (!equippedWeapon) return { label: `+${itemAtk} ATK`, variant: 'positive' };
    if (equippedWeapon.id === item.id) return { label: 'Equipped', variant: 'neutral' };

    const equippedAtk = equippedWeapon.bonuses?.attack ?? 0;
    const delta = itemAtk - equippedAtk;
    const sign = delta > 0 ? '+' : '';
    const variant = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
    return { label: `${sign}${delta} ATK`, variant };
  };

  // --- Actions ---
  const handleEquipItem = (item: Item) => {
    if (item.type === 'Consumable') return;
    const slot = item.type as EquipmentSlot;
    const currentlyEquipped = equipment[slot];

    equipItem(item);
    removeItem(item.id);

    if (currentlyEquipped) {
      addItem(currentlyEquipped);
    }
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    if (item) {
      addItem(item);
      unequipItem(slot);
    }
  };

  const handleUseItem = (item: Item) => {
    const healAmount = item.effects?.heal ?? 0;
    const tempBuff = item.effects?.tempBuff;

    if (healAmount > 0) {
      regenHP(healAmount);
    }

    if (tempBuff) {
      addTempBuff(tempBuff.name, tempBuff.bonuses, tempBuff.durationSteps);
    }

    removeItem(item.id);
  };

  const handleSlotOpen = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    if (item) setSelectedItem(item);
  };

  const selectedIsEquipped = selectedItem
    ? equipment[selectedItem.type as EquipmentSlot]?.id === selectedItem.id
    : false;

  return (
    <div className="inventory-page">
      {/* LEFT PANEL */}
      <div className="equipment-section">
        <h2>Character</h2>
        <div className="equip-grid">
          {(Object.keys(equipment) as EquipmentSlot[]).map(slot => (
            <div
              key={slot}
              className={`equip-slot ${equipment[slot] ? 'equip-slot-clickable' : ''}`}
              onClick={() => handleSlotOpen(slot)}
              role="button"
              tabIndex={equipment[slot] ? 0 : -1}
              onKeyDown={(e) => {
                if (!equipment[slot]) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSlotOpen(slot);
                }
              }}
            >
              <div className="equip-slot-label">{slot}</div>
              {equipment[slot] ? (
                <div className="equip-slot-content">
                  <div className="equip-item">
                    <span className="equip-icon">{itemIcons[slot]}</span>
                    <div>
                      <strong>{equipment[slot]?.name}</strong>
                      <div className="stat-text">{equipment[slot]?.stat}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="equip-empty">Empty Slot</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="inventory-section">
        <div className="inventory-topbar">
          <h2>Satchel</h2>
          
          {/* Controls */}
          <div className="inventory-controls">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as ItemType | 'All')}
            >
              <option value="All">All Types</option>
              <option value="Weapon">Weapons</option>
              <option value="Head Wear">Head Wear</option>
              <option value="Body Armor">Body Armor</option>
              <option value="Pants">Pants</option>
              <option value="Consumable">Consumables</option>
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'level' | 'rarity')}
            >
              <option value="level">Sort: Lvl</option>
              <option value="rarity">Sort: Rarity</option>
            </select>
          </div>
        </div>

        <div className="inventory-list">
          <div className="list-header">
            <div style={{ flex: 1.7, textAlign: 'left' }}>Item Name</div>
            <div style={{ flex: 0.95 }}>Type</div>
            <div style={{ flex: 0.7 }}>Lvl</div>
            <div style={{ flex: 0.9 }}>Rarity</div>
            <div style={{ flex: 0.95 }}>Stat</div>
          </div>

          <div className="items-container">
            {paginatedItems.map(item => {
              const weaponDelta = getWeaponDelta(item);
              const statLabel = weaponDelta ? weaponDelta.label : item.stat;
              const statClass = weaponDelta ? `stat-text stat-${weaponDelta.variant}` : 'stat-text';

              return (
                <div key={item.id} className="inventory-row" onClick={() => setSelectedItem(item)}>
                  <div style={{ flex: 1.7, fontWeight: 'bold', textAlign: 'left' }}>
                    <span className="item-icon">{itemIcons[item.type]}</span>
                    {item.name}
                  </div>
                  <div style={{ flex: 0.95, color: 'var(--text-muted)' }}>{item.type}</div>
                  <div style={{ flex: 0.7 }}>{item.level}</div>
                  <div style={{ flex: 0.9, color: `var(--${item.rarity.toLowerCase()})` }}>{item.rarity}</div>
                  <div style={{ flex: 0.95 }} className={statClass}>{statLabel}</div>
                </div>
              );
            })}
            
            {paginatedItems.length === 0 && (
              <div className="empty-message">No items found.</div>
            )}
          </div>

          {/* Pagination Nav */}
          <div className="page-nav">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">{itemIcons[selectedItem.type]}</div>
              <div>
                <h2 style={{ color: `var(--${selectedItem.rarity.toLowerCase()})` }}>{selectedItem.name}</h2>
                <div className="modal-sub">{selectedItem.type} • {selectedItem.rarity}</div>
              </div>
            </div>
            <p className="flavor-text">"{selectedItem.flavorText}"</p>
            <div className="modal-chips">
              <span className="chip">Lvl {selectedItem.level}</span>
              <span className="chip chip-accent">{selectedItem.stat}</span>
              {selectedIsEquipped && <span className="chip chip-muted">Equipped</span>}
            </div>
            <div className="modal-actions">
              {selectedItem.type === 'Consumable' ? (
                <button onClick={() => { handleUseItem(selectedItem); setSelectedItem(null); }}>Use Item</button>
              ) : selectedIsEquipped ? (
                <button onClick={() => { handleUnequipItem(selectedItem.type as EquipmentSlot); setSelectedItem(null); }}>Unequip</button>
              ) : (
                <button onClick={() => { handleEquipItem(selectedItem); setSelectedItem(null); }}>Equip</button>
              )}
              <button className="modal-close" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
