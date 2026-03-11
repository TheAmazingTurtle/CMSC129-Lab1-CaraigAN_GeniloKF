import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer } from './PlayerContext';
import { useEquipment } from './EquipmentContext';
import { useItems } from './ItemContext';

const SAVE_URL = 'http://localhost:5000/api/player';

type HydrateFns = {
  hydratePlayer: ReturnType<typeof usePlayer>['hydratePlayer'];
  hydrateEquipment: ReturnType<typeof useEquipment>['hydrateEquipment'];
  hydrateInventory: ReturnType<typeof useItems>['hydrateInventory'];
};

const GameSaveGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    level,
    gold,
    exp,
    hp,
    skillPoints,
    skillStats,
    buffs,
    stepsTaken,
    totalDamageDealt,
    totalDamageReceived,
    totalGoldEarned,
    hydratePlayer,
  } = usePlayer();
  const { equipment, hydrateEquipment } = useEquipment();
  const { inventory, hydrateInventory } = useItems();

  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimeout = useRef<number | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const hydrateRef = useRef<HydrateFns>({ hydratePlayer, hydrateEquipment, hydrateInventory });

  hydrateRef.current = { hydratePlayer, hydrateEquipment, hydrateInventory };

  const token = localStorage.getItem('game_token');

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setIsHydrated(true);
      return () => {
        isActive = false;
      };
    }

    fetch(SAVE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load player');
        return res.json();
      })
      .then((data) => {
        if (!isActive) return;
        const player = data?.player;
        if (player) {
          const { hydratePlayer: hpFn, hydrateInventory: hiFn, hydrateEquipment: heFn } = hydrateRef.current;
          hpFn(player);
          if (player.inventory) hiFn(player.inventory);
          if (player.equipment) heFn(player.equipment);
        }
      })
      .catch(() => {
        if (isActive) setIsHydrated(true);
      })
      .finally(() => {
        if (isActive) setIsHydrated(true);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const savePayload = useMemo(() => ({
    level,
    gold,
    exp,
    hp,
    skillPoints,
    skillStats,
    buffs,
    stepsTaken,
    totalDamageDealt,
    totalDamageReceived,
    totalGoldEarned,
    inventory,
    equipment,
  }), [
    level,
    gold,
    exp,
    hp,
    skillPoints,
    skillStats,
    buffs,
    stepsTaken,
    totalDamageDealt,
    totalDamageReceived,
    totalGoldEarned,
    inventory,
    equipment,
  ]);

  const payloadString = useMemo(() => JSON.stringify(savePayload), [savePayload]);

  useEffect(() => {
    if (!isHydrated || !token) return;

    if (payloadString === lastPayloadRef.current) return;
    lastPayloadRef.current = payloadString;

    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = window.setTimeout(() => {
      fetch(SAVE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payloadString,
      }).catch(() => undefined);
    }, 600);

    return () => {
      if (saveTimeout.current) {
        window.clearTimeout(saveTimeout.current);
      }
    };
  }, [isHydrated, token, payloadString]);

  return <>{children}</>;
};

export default GameSaveGate;
