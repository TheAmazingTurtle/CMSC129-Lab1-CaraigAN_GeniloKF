import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer } from './PlayerContext';
import { useEquipment } from './EquipmentContext';
import { useItems } from './ItemContext';
import { getApiBaseUrl } from '../config.ts';
import { SaveProvider } from './SaveContext.tsx';
import { apiRequest } from '../services/apiClient.ts';

const SAVE_PATH = '/api/player';

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const saveTimeout = useRef<number | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const hydrateRef = useRef<HydrateFns>({ hydratePlayer, hydrateEquipment, hydrateInventory });

  hydrateRef.current = { hydratePlayer, hydrateEquipment, hydrateInventory };

  const token = localStorage.getItem('game_token');

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

  const saveNow = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiRequest(SAVE_PATH, {
        method: 'PUT',
        token,
        body: savePayload,
      });
      setLastSavedAt(Date.now());
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setIsHydrated(true);
      return () => {
        isActive = false;
      };
    }

    apiRequest<{ player?: any }>(SAVE_PATH, {
      token,
      retry: 1,
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

  useEffect(() => {
    if (!isHydrated || !token) return;

    if (payloadString === lastPayloadRef.current) return;
    lastPayloadRef.current = payloadString;

    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = window.setTimeout(() => {
      apiRequest(SAVE_PATH, {
        method: 'PUT',
        token,
        body: savePayload,
      })
        .then(() => setLastSavedAt(Date.now()))
        .catch((err: any) => setSaveError(err?.message || 'Failed to save.'));
    }, 600);

    return () => {
      if (saveTimeout.current) {
        window.clearTimeout(saveTimeout.current);
      }
    };
  }, [isHydrated, token, payloadString]);

  useEffect(() => {
    if (!token) return;

    const handleBeforeUnload = () => {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}${SAVE_PATH}`;
      const payload = payloadString;

      fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [token, payloadString]);

  return (
    <SaveProvider value={{ lastSavedAt, saving, saveError, saveNow }}>
      {children}
    </SaveProvider>
  );
};

export default GameSaveGate;
