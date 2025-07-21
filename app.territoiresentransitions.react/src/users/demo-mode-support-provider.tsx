import { noop } from 'es-toolkit';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(
  undefined
);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    return {
      isDemoMode: false,
      toggleDemoMode: noop,
    };
  }
  return context;
};

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('demoMode') === 'true');
    }
  }, []);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('demoMode', String(newValue));
      }
      return newValue;
    });
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};
