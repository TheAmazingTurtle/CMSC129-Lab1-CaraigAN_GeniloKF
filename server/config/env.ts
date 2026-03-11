import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getPort = () => {
  const raw = process.env.PORT;
  if (!raw) return 5000;
  const port = Number(raw);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return port;
};

const getJwtSecret = () => requireEnv('JWT_SECRET');

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '24h';

export { getJwtSecret, getJwtExpiresIn, getPort };
