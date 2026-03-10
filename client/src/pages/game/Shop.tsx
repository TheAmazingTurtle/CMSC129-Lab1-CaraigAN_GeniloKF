import React, { useState, useMemo } from 'react';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import './Shop.css';

// ShopItem mirrors the ShopItem interface in buyRoute.ts.
// buyPrice, repeatable, and minLevel are shop-only fields — not stored in DB.
interface ShopItem {
  id:         number;
  name:       string;
  type:       string;
  level:      number;
  rarity:     string;
  stat:       string;
  flavorText: string;
  buyPrice:   number;
  repeatable: boolean;
  minLevel:   number;
}

// Mirrors SHOP_CATALOGUE in buyRoute.ts exactly.
// Any changes here must be reflected on the server too.
const SHOP_CATALOGUE: ShopItem[] = [
  // Tier 1 (level 1+)
  { id: 301, name: "Health Potion",        type: "Consumable", level: 1, rarity: "Common",   stat: "+50 HP",         flavorText: "A reliable swig of crimson remedy.",             buyPrice: 30,  repeatable: true,  minLevel: 1  },
  { id: 302, name: "Traveller's Tunic",    type: "Body Armor", level: 1, rarity: "Common",   stat: "+3 DEF",         flavorText: "Worn by a thousand wanderers before you.",       buyPrice: 40,  repeatable: false, minLevel: 1  },
  { id: 303, name: "Wooden Club",          type: "Weapon",     level: 1, rarity: "Common",   stat: "+3 ATK",         flavorText: "A lump of oak with attitude.",                   buyPrice: 40,  repeatable: false, minLevel: 1  },
  { id: 304, name: "Frayed Cap",           type: "Head Wear",  level: 1, rarity: "Common",   stat: "+2 DEF",         flavorText: "It keeps the rain out. Mostly.",                 buyPrice: 25,  repeatable: false, minLevel: 1  },
  { id: 305, name: "Rough-Spun Trousers",  type: "Pants",      level: 1, rarity: "Common",   stat: "+2 DEF",         flavorText: "Itchy, but better than nothing.",                buyPrice: 25,  repeatable: false, minLevel: 1  },
  // Tier 2 (level 5+)
  { id: 306, name: "Greater Health Potion",type: "Consumable", level: 3, rarity: "Uncommon", stat: "+120 HP",        flavorText: "Smells like berries and good decisions.",         buyPrice: 80,  repeatable: true,  minLevel: 5  },
  { id: 307, name: "Chainmail Vest",       type: "Body Armor", level: 4, rarity: "Uncommon", stat: "+10 DEF",        flavorText: "Every ring a promise of survival.",              buyPrice: 150, repeatable: false, minLevel: 5  },
  { id: 308, name: "Iron Sword",           type: "Weapon",     level: 4, rarity: "Uncommon", stat: "+9 ATK",         flavorText: "Reliable. Honest. Occasionally brutal.",         buyPrice: 150, repeatable: false, minLevel: 5  },
  { id: 309, name: "Scout's Hood",         type: "Head Wear",  level: 3, rarity: "Uncommon", stat: "+5 DEF, +1 DEX", flavorText: "Shadows like you when you wear this.",           buyPrice: 100, repeatable: false, minLevel: 5  },
  { id: 310, name: "Reinforced Leggings",  type: "Pants",      level: 4, rarity: "Uncommon", stat: "+7 DEF",         flavorText: "Stops most things below the waist.",             buyPrice: 100, repeatable: false, minLevel: 5  },
  // Tier 3 (level 10+)
  { id: 311, name: "Elixir of Fortitude",  type: "Consumable", level: 5, rarity: "Rare",     stat: "+250 HP",        flavorText: "One sip and the ground fears your footsteps.",   buyPrice: 200, repeatable: true,  minLevel: 10 },
  { id: 312, name: "Plate Cuirass",        type: "Body Armor", level: 6, rarity: "Rare",     stat: "+18 DEF",        flavorText: "Forged in the fires of a serious craftsman.",    buyPrice: 400, repeatable: false, minLevel: 10 },
  { id: 313, name: "Runed Blade",          type: "Weapon",     level: 6, rarity: "Rare",     stat: "+16 ATK",        flavorText: "The runes hum softly. They hunger.",             buyPrice: 400, repeatable: false, minLevel: 10 },
  { id: 314, name: "Warhelm",              type: "Head Wear",  level: 6, rarity: "Rare",     stat: "+14 DEF",        flavorText: "The visor makes everything look like a battlefield.", buyPrice: 300, repeatable: false, minLevel: 10 },
  { id: 315, name: "Greatplate Greaves",   type: "Pants",      level: 6, rarity: "Rare",     stat: "+12 DEF",        flavorText: "Your stride now echoes three seconds later.",    buyPrice: 300, repeatable: false, minLevel: 10 },
];

const TIERS = [
  { label: 'TIER I',   minLevel: 1,  cssClass: 'tier-1', unlockLabel: null },
  { label: 'TIER II',  minLevel: 5,  cssClass: 'tier-2', unlockLabel: 'Unlocks at level 5'  },
  { label: 'TIER III', minLevel: 10, cssClass: 'tier-3', unlockLabel: 'Unlocks at level 10' },
];

const Shop: React.FC = () => {
  const { gold, level, inventory, equippedItems, setGold, setInventory, setLastSaved } = usePlayer();

  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [isBuying, setIsBuying]       = useState(false);
  const [toast, setToast]             = useState('');

  const getToken = () => localStorage.getItem('game_token') ?? '';

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Derive which shop items the player already owns (inventory or equipped).
  // Used to grey out non-repeatable items.
  const ownedIds = useMemo(() => {
    const ids = new Set<number>();
    inventory.forEach(i => ids.add(i.id));
    Object.values(equippedItems).forEach(e => { if (e) ids.add(e.id); });
    return ids;
  }, [inventory, equippedItems]);

  const isOwned = (item: ShopItem) => !item.repeatable && ownedIds.has(item.id);
  const canAfford = (item: ShopItem) => gold >= item.buyPrice;

  const executeBuy = async () => {
    if (!confirmItem || isBuying) return;
    setIsBuying(true);

    try {
      const res = await fetch('http://localhost:5000/api/game/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ itemId: confirmItem.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        flashToast(`⚠ ${data.message ?? 'Purchase failed'}`);
      } else {
        setInventory(data.inventory);
        setGold(data.gold);
        if (data.lastSaved) setLastSaved(new Date(data.lastSaved));
        flashToast(`✓ Purchased ${confirmItem.name}`);
      }
    } catch {
      flashToast('⚠ Cannot reach server');
    } finally {
      setIsBuying(false);
      setConfirmItem(null);
    }
  };

  return (
    <div className="shop-page">

      {/* Toast */}
      {toast && <div className="shop-toast">{toast}</div>}

      <div className="shop-header">
        <h2>⚔️ Merchant's Stall</h2>
        <span className="shop-gold">💰 {gold} gold</span>
      </div>

      {TIERS.map(tier => {
        const tierItems = SHOP_CATALOGUE.filter(i => i.minLevel === tier.minLevel);
        const unlocked  = level >= tier.minLevel;

        return (
          <div key={tier.label} className="shop-section">
            <div className={`shop-tier-badge ${tier.cssClass}`}>{tier.label}</div>

            {!unlocked ? (
              <div className="shop-locked">
                <span className="shop-locked-icon">🔒</span>
                <span>{tier.unlockLabel} — you are level {level}</span>
              </div>
            ) : (
              <div className="shop-items">
                {tierItems.map(item => {
                  const owned   = isOwned(item);
                  const afford  = canAfford(item);

                  return (
                    <div
                      key={item.id}
                      className={`shop-item-row${owned ? ' owned' : ''}`}
                      title={item.flavorText}
                    >
                      <div className="shop-item-name">{item.name}</div>
                      <div className="shop-item-type">{item.type}</div>
                      <div
                        className="shop-item-rarity"
                        style={{ color: `var(--${item.rarity.toLowerCase()})` }}
                      >
                        {item.rarity}
                      </div>
                      <div className="shop-item-stat">{item.stat}</div>
                      <div className="shop-item-price">{item.buyPrice}g</div>
                      <button
                        className="shop-buy-btn"
                        disabled={owned || !afford}
                        onClick={() => setConfirmItem(item)}
                        title={
                          owned   ? 'Already owned' :
                          !afford ? `Need ${item.buyPrice - gold} more gold` :
                          `Buy for ${item.buyPrice}g`
                        }
                      >
                        {owned ? 'Owned' : 'Buy'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Buy confirmation modal */}
      {confirmItem && (
        <div className="shop-modal-overlay" onClick={() => !isBuying && setConfirmItem(null)}>
          <div className="shop-modal" onClick={e => e.stopPropagation()}>
            <h3>Buy Item?</h3>
            <p style={{ margin: '0.75rem 0' }}>
              <strong style={{ color: `var(--${confirmItem.rarity.toLowerCase()})` }}>
                {confirmItem.name}
              </strong>
            </p>
            <p>{confirmItem.stat}</p>
            <p style={{ fontStyle: 'italic', color: '#666', fontSize: '0.78rem', margin: '0.5rem 0' }}>
              "{confirmItem.flavorText}"
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              Cost: <strong style={{ color: '#ffd700' }}>{confirmItem.buyPrice} gold</strong>
              &nbsp;·&nbsp;
              You have: <strong style={{ color: gold >= confirmItem.buyPrice ? '#ffd700' : '#c0392b' }}>
                {gold} gold
              </strong>
            </p>
            <div className="shop-modal-actions">
              <button onClick={executeBuy} disabled={isBuying}>
                {isBuying ? 'Buying...' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmItem(null)} disabled={isBuying}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;