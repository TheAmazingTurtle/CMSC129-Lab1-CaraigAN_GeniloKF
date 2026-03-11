const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL. Set it in your environment.');
  }
  return API_BASE_URL.replace(/\/$/, '');
};

export { getApiBaseUrl };
