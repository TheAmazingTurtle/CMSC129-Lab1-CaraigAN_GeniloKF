const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const validatePlayerSavePayload = (body: unknown) => {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Invalid request body.' } as const;
  }

  const numberFields = [
    'level',
    'gold',
    'exp',
    'hp',
    'skillPoints',
    'stepsTaken',
    'totalDamageDealt',
    'totalDamageReceived',
    'totalGoldEarned',
  ];

  for (const field of numberFields) {
    const value = body[field];
    if (value !== undefined && typeof value !== 'number') {
      return { ok: false, message: `Field ${field} must be a number.` } as const;
    }
  }

  if (body.skillStats !== undefined && !isPlainObject(body.skillStats)) {
    return { ok: false, message: 'skillStats must be an object.' } as const;
  }

  if (body.buffs !== undefined && !Array.isArray(body.buffs)) {
    return { ok: false, message: 'buffs must be an array.' } as const;
  }

  if (body.inventory !== undefined && !Array.isArray(body.inventory)) {
    return { ok: false, message: 'inventory must be an array.' } as const;
  }

  if (body.equipment !== undefined && !isPlainObject(body.equipment)) {
    return { ok: false, message: 'equipment must be an object.' } as const;
  }

  return { ok: true } as const;
};

export { validatePlayerSavePayload };
