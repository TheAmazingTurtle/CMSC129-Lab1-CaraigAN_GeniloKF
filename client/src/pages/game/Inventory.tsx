import React, { useState, useMemo, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import type { Item, EquipmentSlot, ItemType, Rarity } from '../../contexts/PlayerContext.tsx';
import './Inventory.css';

// NOTE: Item, EquipmentSlot, ItemType, Rarity are exported from PlayerContext.tsx
// as the single source of truth. The Mongoose schema in User.ts mirrors them exactly.

const ITEMS_PER_PAGE = 5;

// Mirrors sellRoute.ts — used for display only. Server is authoritative for actual gold.
const RARITY_SELL_MULTIPLIER: Record<Rarity, number> = {
  Common: 1.0, Uncommon: 1.5, Rare: 2.5, Epic: 4.0, Legendary: 7.0,
};
const getSellPrice = (item: Item): number =>
  Math.floor(item.level * 10 * RARITY_SELL_MULTIPLIER[item.rarity]);

const Inventory: React.FC = () => {
  const {
    inventory, setInventory,
    equippedItems, setEquippedItems,
    setGold, setLastSaved,
    savePlayerState,
  } = usePlayer();

  const equipped = equippedItems as Record<EquipmentSlot, Item | null>;

  const [selectedItem, setSelectedItem]   = useState<Item | null>(null);
  const [saveStatus, setSaveStatus]       = useState<string>('');
  const [filterType, setFilterType]       = useState<ItemType | 'All'>('All');
  const [sortBy, setSortBy]               = useState<'level' | 'rarity'>('level');
  const [currentPage, setCurrentPage]     = useState(1);
  const [confirmSell, setConfirmSell]     = useState<{ item: Item; rawIndex: number } | null>(null);

  const flashSaveStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const getToken = () => localStorage.getItem('game_token') ?? '';

  // --- Equip / Unequip ---
  // Calls POST /api/game/equip — all mutations are atomic on the server.
  // Context is hydrated from the response, never from optimistic setState.
  const postEquip = async (body: object): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/api/game/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        flashSaveStatus(`⚠ ${err.message ?? 'Server error'}`);
        return false;
      }
      const data = await res.json();
      setInventory(data.inventory);
      setEquippedItems(data.equippedItems);
      if (data.lastSaved) setLastSaved(new Date(data.lastSaved));
      return true;
    } catch {
      flashSaveStatus('⚠ Cannot reach server');
      return false;
    }
  };

  // inventoryIndex is the item's position in the RAW inventory array.
  // The server splices by this index — immune to duplicate-id collisions.
  const equipItem = async (item: Item, inventoryIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'Consumable') return;
    const ok = await postEquip({ action: 'equip', inventoryIndex, slot: item.type });
    flashSaveStatus(ok ? '✓ Equipped & saved' : '⚠ Equip failed');
  };

  const unequipItem = async (slot: EquipmentSlot) => {
    const ok = await postEquip({ action: 'unequip', slot });
    flashSaveStatus(ok ? '✓ Unequipped & saved' : '⚠ Unequip failed');
  };

  // --- Use (consumables) ---
  const useItem = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`You used: ${item.name}!`);
    setInventory(prev => {
      // Remove only the first occurrence — safe for duplicates
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

  // --- Sell ---
  const confirmSellItem = (item: Item, rawIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmSell({ item, rawIndex });
  };

  const executeSell = async () => {
    if (!confirmSell) return;
    const { rawIndex } = confirmSell;
    setConfirmSell(null);

    try {
      const res = await fetch('http://localhost:5000/api/game/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ inventoryIndex: rawIndex }),
      });
      if (!res.ok) {
        const err = await res.json();
        flashSaveStatus(`⚠ ${err.message ?? 'Sell failed'}`);
        return;
      }
      const data = await res.json();
      setInventory(data.inventory);
      setGold(data.gold);
      if (data.lastSaved) setLastSaved(new Date(data.lastSaved));
      flashSaveStatus(`✓ Sold for ${data.goldEarned} gold`);
    } catch {
      flashSaveStatus('⚠ Cannot reach server');
    }
  };

  // --- Display helpers ---
  const processedItems = useMemo(() => {
    let result = [...inventory];
    if (filterType !== 'All') result = result.filter(item => item.type === filterType);
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

  // Resolve the item's true index in the raw inventory array.
  // Counts prior occurrences of the same id in paginatedItems to correctly
  // identify which duplicate is being acted on.
  const resolveRawIndex = (item: Item, positionInPage: number): number => {
    const occurrencesBeforeThis = paginatedItems
      .slice(0, positionInPage)
      .filter(i => i.id === item.id).length;
    let found = 0;
    return inventory.findIndex(i => {
      if (i.id !== item.id) return false;
      if (found === occurrencesBeforeThis) return true;
      found++;
      return false;
    });
  };

  return (
    <div className="inventory-page">

      {/* Toast notification */}
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
            <div style={{ flex: 1.5 }}>Actions</div>
          </div>

          <div className="items-container">
            {paginatedItems.map((item, positionInPage) => {
              const rawIndex = resolveRawIndex(item, positionInPage);
              const sellPrice = getSellPrice(item);

              return (
                <div key={`${item.id}-${rawIndex}`} className="inventory-row" onClick={() => setSelectedItem(item)}>
                  <div style={{ flex: 1.5, fontWeight: 'bold', textAlign: 'left' }}>{item.name}</div>
                  <div style={{ flex: 1, color: 'var(--text-muted)' }}>{item.type}</div>
                  <div style={{ flex: 1 }}>{item.level}</div>
                  <div style={{ flex: 1, color: `var(--${item.rarity.toLowerCase()})` }}>{item.rarity}</div>
                  <div style={{ flex: 1 }} className="stat-text">{item.stat}</div>
                  <div style={{ flex: 1.5, display: 'flex', gap: '0.4rem' }}>
                    {item.type === 'Consumable' ? (
                      <button onClick={(e) => useItem(item, e)}>Use</button>
                    ) : (
                      <button onClick={(e) => equipItem(item, rawIndex, e)}>Equip</button>
                    )}
                    <button
                      onClick={(e) => confirmSellItem(item, rawIndex, e)}
                      style={{ color: '#f0a500', borderColor: '#f0a500' }}
                      title={`Sell for ${sellPrice}g`}
                    >
                      {sellPrice}g
                    </button>
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

      {/* SELL CONFIRMATION MODAL */}
      {confirmSell && (
        <div className="modal-overlay" onClick={() => setConfirmSell(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sell Item?</h2>
            <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
              <strong style={{ color: `var(--${confirmSell.item.rarity.toLowerCase()})` }}>
                {confirmSell.item.name}
              </strong>
            </p>
            <p>You will receive <strong style={{ color: '#f0a500' }}>{getSellPrice(confirmSell.item)} gold</strong>.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={executeSell} style={{ flex: 1, padding: '0.8rem', color: '#f0a500', borderColor: '#f0a500' }}>
                Confirm Sell
              </button>
              <button onClick={() => setConfirmSell(null)} style={{ flex: 1, padding: '0.8rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM DETAIL MODAL */}
      {selectedItem && !confirmSell && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: `var(--${selectedItem.rarity.toLowerCase()})` }}>{selectedItem.name}</h2>
            <p className="flavor-text">"{selectedItem.flavorText}"</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>{selectedItem.type}</span>
              <span>{selectedItem.rarity}</span>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#f0a500' }}>
              Sell value: {getSellPrice(selectedItem)} gold
            </p>
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