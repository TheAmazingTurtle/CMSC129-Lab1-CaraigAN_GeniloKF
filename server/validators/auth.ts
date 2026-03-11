const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

const validateAuthPayload = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Invalid request body.' };
  }

  const { email, password } = body as { email?: unknown; password?: unknown };

  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    return { ok: false, message: 'Valid email is required.' };
  }

  if (!isNonEmptyString(password) || password.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }

  return { ok: true, email, password } as const;
};

export { validateAuthPayload };
