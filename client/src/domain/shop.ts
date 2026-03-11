import type { Item } from '../contexts/EquipmentContext';

const ROTATION_HOURS = 6;

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: string) => {
  let value = hashSeed(seed) || 1;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value & 0x7fffffff) / 2147483647;
  };
};

const getShopRotationKey = (date = new Date()) => {
  const block = Math.floor(date.getHours() / ROTATION_HOURS);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${block}`;
};

const getNextRotationDate = (date = new Date()) => {
  const block = Math.floor(date.getHours() / ROTATION_HOURS);
  const nextBlockHour = (block + 1) * ROTATION_HOURS;
  const next = new Date(date);

  if (nextBlockHour >= 24) {
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
  } else {
    next.setHours(nextBlockHour, 0, 0, 0);
  }

  return next;
};

const buildShopStock = (items: Item[], rotationKey: string, size = 12) => {
  const rng = seededRandom(rotationKey);
  const pool = [...items];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(size, pool.length));
};

export { getShopRotationKey, getNextRotationDate, buildShopStock, ROTATION_HOURS };
