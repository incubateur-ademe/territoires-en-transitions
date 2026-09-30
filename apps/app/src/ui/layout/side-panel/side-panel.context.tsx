'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { match } from 'ts-pattern';

import type {
  Panel,
  PanelAction,
  PanelState,
  UseSidePanel,
  UseSidePanelOptions,
} from './side-panel.contract';

type OnCloseRequest = NonNullable<UseSidePanelOptions['onCloseRequest']>;

type PanelContextType = {
  panel: PanelState;
  setPanel: (action: PanelAction) => void;
  setTitle: (title: string) => void;
  registerOnClose: (callback: (() => void) | undefined) => void;
  registerOnCloseRequest: (callback: OnCloseRequest) => void;
  unregisterOnCloseRequest: (callback: OnCloseRequest) => void;
  requestClose: () => void;
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

type CloseRequestRegistration = {
  readonly registerOnCloseRequest: (callback: OnCloseRequest) => void;
  readonly unregisterOnCloseRequest: (callback: OnCloseRequest) => void;
  readonly requestClose: () => void;
};

const useCloseRequestRegistration = (
  close: () => void
): CloseRequestRegistration => {
  const registeredCallback = useRef<OnCloseRequest | undefined>(undefined);

  const registerOnCloseRequest = useCallback((callback: OnCloseRequest) => {
    registeredCallback.current = callback;
  }, []);

  const unregisterOnCloseRequest = useCallback((callback: OnCloseRequest) => {
    const isRegisteredCallback = registeredCallback.current === callback;
    if (!isRegisteredCallback) {
      return;
    }
    registeredCallback.current = undefined;
  }, []);

  const requestClose = useCallback(() => {
    const outcome = registeredCallback.current?.() ?? 'close';
    match(outcome)
      .with('stay-open', () => undefined)
      .with('close', () => close())
      .exhaustive();
  }, [close]);

  return { registerOnCloseRequest, unregisterOnCloseRequest, requestClose };
};

export const SidePanelProvider = ({ children }: { children: ReactNode }) => {
  const [panel, dispatch] = useReducer(panelReducer, {
    isOpen: false,
    title: '',
  });

  const onCloseRegisteredCallback = useRef<(() => void) | undefined>(undefined);
  const isOpenRef = useRef(false);
  /**
   * Prédicat de persistance du panneau ouvert, tenu à jour au dispatch et non
   * lu dans l'état : à la navigation, la page atteinte ouvre son panneau depuis
   * son effet, et l'effet de fermeture qui suit dans le même cycle verrait
   * encore l'état d'avant — donc refermerait le panneau qui vient de s'ouvrir.
   */
  const isPersistentRef = useRef<Panel['isPersistentWithNextPath']>(undefined);

  const registerOnClose = useCallback((callback: (() => void) | undefined) => {
    onCloseRegisteredCallback.current = callback;
  }, []);

  const close = useCallback(() => {
    if (isOpenRef.current) {
      onCloseRegisteredCallback.current?.();
    }
    isOpenRef.current = false;
    isPersistentRef.current = undefined;
    dispatch({ type: 'close' });
  }, []);

  const { registerOnCloseRequest, unregisterOnCloseRequest, requestClose } =
    useCloseRequestRegistration(close);

  const setPanel = useCallback(
    (action: PanelAction) => {
      if (action.type === 'close') {
        close();
        return;
      }
      if (action.type === 'closeOnRouteChange') {
        if (!isPersistentRef.current?.(action.path)) {
          close();
        }
        return;
      }
      if (action.type === 'open') {
        isOpenRef.current = true;
        isPersistentRef.current = action.isPersistentWithNextPath;
      }
      dispatch(action);
    },
    [close]
  );

  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'setTitle', title });
  }, []);

  return (
    <PanelContext
      value={{
        panel,
        setPanel,
        setTitle,
        registerOnClose,
        registerOnCloseRequest,
        unregisterOnCloseRequest,
        requestClose,
      }}
    >
      {children}
    </PanelContext>
  );
};

const usePanelContext = (): PanelContextType => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel doit être utilisé dans PanelProvider');
  }
  return context;
};

export const useSidePanel: UseSidePanel = (options) => {
  const {
    registerOnClose,
    registerOnCloseRequest,
    unregisterOnCloseRequest,
    panel,
    setPanel,
    setTitle,
  } = usePanelContext();

  useEffect(() => {
    if (options?.onClose) {
      registerOnClose(options.onClose);
      return () => registerOnClose(undefined);
    }
  }, [options?.onClose, registerOnClose]);

  useEffect(() => {
    const onCloseRequest = options?.onCloseRequest;
    if (onCloseRequest) {
      registerOnCloseRequest(onCloseRequest);
      return () => unregisterOnCloseRequest(onCloseRequest);
    }
  }, [
    options?.onCloseRequest,
    registerOnCloseRequest,
    unregisterOnCloseRequest,
  ]);

  return { panel, setPanel, setTitle };
};

export const useRequestSidePanelClose = (): (() => void) =>
  usePanelContext().requestClose;
