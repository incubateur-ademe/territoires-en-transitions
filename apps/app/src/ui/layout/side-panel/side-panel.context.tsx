'use client';

import React, {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';

export type SidePanelTitleProps = {
  title?: string;
};

type Panel = {
  isPersistentWithNextPath?: (path: string) => boolean;
  title?: string;
  Title?: ComponentType<SidePanelTitleProps>;
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
  setPanel: (action: PanelAction) => void;
  setTitle: (title: string) => void;
  registerOnClose: (callback: (() => void) | undefined) => void;
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

  const onCloseRegisteredCallback = useRef<(() => void) | undefined>(undefined);
  const isOpenRef = useRef(false);

  const registerOnClose = useCallback((callback: (() => void) | undefined) => {
    onCloseRegisteredCallback.current = callback;
  }, []);

  const setPanel = useCallback((action: PanelAction) => {
    if (action.type === 'close' && isOpenRef.current) {
      onCloseRegisteredCallback.current?.();
    }
    isOpenRef.current = action.type === 'open';
    dispatch(action);
  }, []);

  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'setTitle', title });
  }, []);

  return (
    <PanelContext value={{ panel, setPanel, setTitle, registerOnClose }}>
      {children}
    </PanelContext>
  );
};

type UseSidePanelOptions = {
  onClose?: () => void;
};

type UseSidePanelReturn = {
  panel: PanelState;
  setPanel: (action: PanelAction) => void;
  setTitle: (title: string) => void;
};

export const useSidePanel = (
  options?: UseSidePanelOptions
): UseSidePanelReturn => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel doit être utilisé dans PanelProvider');
  }

  const { registerOnClose, ...rest } = context;

  useEffect(() => {
    if (options?.onClose) {
      registerOnClose(options.onClose);
      return () => registerOnClose(undefined);
    }
  }, [options?.onClose, registerOnClose]);

  return rest;
};
