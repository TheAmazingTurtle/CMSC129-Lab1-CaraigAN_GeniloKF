import React, { useEffect, useState } from 'react';

const ServerStatusBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('server:offline', handleOffline as EventListener);
    window.addEventListener('server:online', handleOnline as EventListener);

    return () => {
      window.removeEventListener('server:offline', handleOffline as EventListener);
      window.removeEventListener('server:online', handleOnline as EventListener);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="server-banner" role="status">
      Backend unavailable. Actions may not save.
    </div>
  );
};

export default ServerStatusBanner;
