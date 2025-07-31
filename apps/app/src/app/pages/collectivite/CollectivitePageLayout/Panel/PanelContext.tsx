import { Event, useEventTracker } from '@/ui';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from 'react';

// type PanelAction = 'open' | 'close' | 'toggle';
type PanelAction = {
  type: 'open' | 'close' | 'updateContent';
  toolbar?: React.ReactNode;
  content?: React.ReactNode;
};

type PanelState = {
  isOpen: boolean;
  toolbar?: React.ReactNode;
  content?: React.ReactNode;
};

type PanelDispatch = (action: PanelAction) => void;

const initialState: PanelState = {
  isOpen: false,
};

const PanelStateContext = createContext<PanelState | undefined>(undefined);
const PanelDispatchContext = createContext<PanelDispatch | undefined>(
  undefined
);

const panelReducer = (state: PanelState, action: PanelAction) => {
  switch (action.type) {
    case 'open': {
      return {
        ...state,
        isOpen: true,
        content: action.content,
        toolbar: action.toolbar,
      };
    }
    case 'close': {
      return {
        isOpen: false,
      };
    }
    case 'updateContent': {
      return {
        ...state,
        content: action.content,
      };
    }
    default: {
      throw new Error(`Unhandled state`);
    }
  }
};

/** Contient le CollectivitePageLayout afin de  rendre accessible les contextes à tous les enfants */
export const PanelProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(panelReducer, initialState);
  const tracker = useEventTracker();

  useEffect(() => {
    tracker(Event.togglePanel, {
      action: state.isOpen ? 'ouverture' : 'fermeture',
    });
  }, [state, tracker]);

  return (
    <PanelStateContext.Provider value={state}>
      <PanelDispatchContext.Provider value={dispatch}>
        {children}
      </PanelDispatchContext.Provider>
    </PanelStateContext.Provider>
  );
};

/** Permet d'accéder à l'état du panneau latéral des pages collectivités */
export const usePanelState = () => {
  const context = useContext(PanelStateContext);

  if (context === undefined) {
    throw new Error('usePanelSate must be used within a PanelProvider');
  }
  return context;
};

/** Permet de modifier l'état du panneau latéral des pages collectivités */
export const usePanelDispatch = () => {
  const context = useContext(PanelDispatchContext);

  if (context === undefined) {
    throw new Error('usePanelDispatch must be used within a PanelProvider');
  }
  return context;
};
