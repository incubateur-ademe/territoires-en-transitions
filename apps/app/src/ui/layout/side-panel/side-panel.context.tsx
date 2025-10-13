'use client';

import { AnchorButtonProps } from '@/ui';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

type Panel = {
  isPersistentWithNextPath?: (path: string) => boolean;
  expand?: AnchorButtonProps;
  title?: string;
  content?: React.ReactNode;
};

type PanelAction =
  | ({
      type: 'open';
    } & Panel)
  | { type: 'close' }
  | { type: 'setTitle'; title: string };

type PanelState = Panel & {
  isOpen: boolean;
};

type PanelContextType = {
  panel: PanelState;
  setPanel: (action: PanelAction) => void;
  setTitle: (title: string) => void;
};

const PanelContext = createContext<PanelContextType | undefined>(undefined);

const panelReducer = (state: PanelState, action: PanelAction): PanelState => {
  switch (action.type) {
    case 'open':
      return {
        ...state,
        ...action,
        isOpen: true,
      };
    case 'close':
      return { isOpen: false };
    case 'setTitle':
      return { ...state, title: action.title };
    default:
      throw new Error(`Action non gérée`);
  }
};

export const SidePanelProvider = ({ children }: { children: ReactNode }) => {
  const [panel, dispatch] = useReducer(panelReducer, {
    isOpen: false,
    title: '',
  });

  const contextValue: PanelContextType = {
    panel,
    setPanel: dispatch,
    setTitle: (title: string) => {
      dispatch({ type: 'setTitle', title });
    },
  };

  return (
    <PanelContext.Provider value={contextValue}>
      {children}
    </PanelContext.Provider>
  );
};

export const useSidePanel = () => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel doit être utilisé dans PanelProvider');
  }
  return context;
};
