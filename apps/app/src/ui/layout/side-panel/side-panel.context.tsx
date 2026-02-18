'use client';

import { AnchorButtonProps } from '@tet/ui';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
} from 'react';

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

export type PanelState = Panel & {
  isOpen: boolean;
};

type PanelContextType = {
  panel: PanelState;
  setPanel: (
    action: PanelAction,
    onChangeCallback?: (type: PanelAction['type']) => void
  ) => void;
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

  const setPanel = useCallback(
    (
      action: PanelAction,
      onChangeCallback?: (type: PanelAction['type']) => void
    ) => {
      dispatch(action);
      onChangeCallback?.(action.type);
    },
    []
  );
  const contextValue: PanelContextType = {
    panel,
    setPanel,
    setTitle: (title: string) => {
      dispatch({ type: 'setTitle', title });
    },
  };

  return <PanelContext value={contextValue}>{children}</PanelContext>;
};

export const useSidePanel = (): PanelContextType => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel doit être utilisé dans PanelProvider');
  }

  return context;
};
