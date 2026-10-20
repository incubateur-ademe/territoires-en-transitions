'use client';
import { createContext, PropsWithChildren, useContext } from 'react';
import { type BaseToast, useBaseToast } from './use-base-toast';
import { useMutationToast } from './use-mutation-toast';

type ToastContextValue = Pick<BaseToast, 'setToast' | 'setToastWithAction'>;

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const { setToast, setToastWithAction, renderToast } = useBaseToast();
  useMutationToast(setToast);
  return (
    <ToastContext.Provider value={{ setToast, setToastWithAction }}>
      {renderToast()}
      {children}
    </ToastContext.Provider>
  );
};
