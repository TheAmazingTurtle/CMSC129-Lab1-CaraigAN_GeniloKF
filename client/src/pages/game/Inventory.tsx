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
    setLastSaved,
    savePlayerState,
  } = usePlayer();

  const equipped = equippedItems as Record<EquipmentSlot, Item | null>;

  const [selectedItem, setSelectedItem]   = useState<Item | null>(null);
  const [saveStatus, setSaveStatus]       = useState<string>('');
  const [filterType, setFilterType]       = useState<ItemType | 'All'>('All');
  const [sortBy, setSortBy]               = useState<'level' | 'rarity'>('level');
  const [currentPage, setCurrentPage]     = useState(1);

  const flashSaveStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const getToken = () => localStorage.getItem('game_token') ?? '';

  // Calls POST /api/game/equip and syncs context from the authoritative server response.
  // The server splices by inventoryIndex — not by id — so duplicate items are handled safely.
  // No setState → savePlayerState race condition: the DB write happens before we update context.
  const postEquip = async (body: object): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/api/game/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        flashSaveStatus(`⚠ ${err.message ?? 'Server error'}`);
        return false;
      }
      const data = await res.json();
      // Update context from server response — always authoritative
      setInventory(data.inventory);
      setEquippedItems(data.equippedItems);
      if (data.lastSaved) setLastSaved(new Date(data.lastSaved));
      return true;
    } catch {
      flashSaveStatus('⚠ Cannot reach server');
      return false;
    }
  };

  // inventoryIndex is the item's position in the RAW inventory array (not the filtered/paginated view).
  // This is what the server needs to splice by index safely.
  const equipItem = async (item: Item, inventoryIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'Consumable') return;
    const slot = item.type as EquipmentSlot;
    const ok = await postEquip({ action: 'equip', inventoryIndex, slot });
    flashSaveStatus(ok ? '✓ Equipped & saved' : '⚠ Equip failed');
  };

  const unequipItem = async (slot: EquipmentSlot) => {
    const ok = await postEquip({ action: 'unequip', slot });
    flashSaveStatus(ok ? '✓ Unequipped & saved' : '⚠ Unequip failed');
  };

  const useItem = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`You used: ${item.name}!`);

    setInventory(prev => {
      // Remove only the first occurrence — safe for duplicate items
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    if (selectedItem?.id === item.id) setSelectedItem(null);

    const result = await savePlayerState();
    flashSaveStatus(result ? '✓ Item used & saved' : '⚠ Item use saved locally only');
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

      {/* LEFT PANEL — equipped slots */}
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

      {/* RIGHT PANEL — satchel */}
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
            {paginatedItems.map((item) => {
              // Resolve the item's true index in the raw inventory array.
              // We track how many times this id has appeared so far in paginatedItems
              // to correctly identify which duplicate we're looking at.
              const occurrencesBeforeThis = paginatedItems
                .slice(0, paginatedItems.indexOf(item))
                .filter(i => i.id === item.id).length;
              let found = 0;
              const rawIndex = inventory.findIndex(i => {
                if (i.id !== item.id) return false;
                if (found === occurrencesBeforeThis) return true;
                found++;
                return false;
              });

              return (
                <div key={`${item.id}-${rawIndex}`} className="inventory-row" onClick={() => setSelectedItem(item)}>
                  <div style={{ flex: 1.5, fontWeight: 'bold', textAlign: 'left' }}>{item.name}</div>
                  <div style={{ flex: 1, color: 'var(--text-muted)' }}>{item.type}</div>
                  <div style={{ flex: 1 }}>{item.level}</div>
                  <div style={{ flex: 1, color: `var(--${item.rarity.toLowerCase()})` }}>{item.rarity}</div>
                  <div style={{ flex: 1 }} className="stat-text">{item.stat}</div>
                  <div style={{ flex: 1 }}>
                    {item.type === 'Consumable' ? (
                      <button onClick={(e) => useItem(item, e)}>Use</button>
                    ) : (
                      <button onClick={(e) => equipItem(item, rawIndex, e)}>Equip</button>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* ITEM DETAIL MODAL */}
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