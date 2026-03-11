import React, { createContext, useContext } from 'react';

type SaveStatus = {
  lastSavedAt: number | null;
  saving: boolean;
  saveError: string | null;
  saveNow: () => Promise<void>;
};

const SaveContext = createContext<SaveStatus | undefined>(undefined);

const SaveProvider: React.FC<{ value: SaveStatus; children: React.ReactNode }> = ({ value, children }) => {
  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>;
};

const useSaveStatus = () => {
  const context = useContext(SaveContext);
  if (!context) throw new Error('useSaveStatus must be used within SaveProvider');
  return context;
};

export type { SaveStatus };
export { SaveProvider, useSaveStatus };
