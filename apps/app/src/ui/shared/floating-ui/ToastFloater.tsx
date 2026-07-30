import React, {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useState,
} from 'react';
import {
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';

const DEFAULT_AUTO_HIDE_DURATION = 4000;

type TToastFloater = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** Nombre en millisecondes à attendre avant d'appeler la fonction onClose.
   * Par default: 4000 */
  autoHideDuration?: number;
};

export const ToastFloater = ({
  open,
  onClose,
  children,
  className,
  autoHideDuration,
}: TToastFloater) => {
  const { refs, context, strategy } = useFloating({
    open,
    strategy: 'fixed',
  });

  const { getFloatingProps } = useInteractions([useDismiss(context)]);

  const [toastWidth, setToastWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    setToastWidth(context.refs.floating.current?.getBoundingClientRect().width);
  });

  // `onClose` hors des dépendances (via useEffectEvent) : le provider la recrée
  // à chaque rendu, la garder en dépendance réarmerait le minuteur sans fin.
  const close = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = setTimeout(
      () => close(),
      autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION
    );
    return () => clearTimeout(timer);
  }, [open, autoHideDuration]);

  return (
    <FloatingPortal>
      {open && (
        <div
          {...getFloatingProps({
            ref: refs.setFloating,
            style: {
              position: strategy,
              maxWidth: '40rem',
              // rajout des 32px de margin left/right pour afficher des marges sur mobile
              left: `calc(50% - (${toastWidth}px + 32px) / 2 )`,
            },
            className: `mx-4 py-2 px-4 bottom-6 text-white bg-gray-800 rounded-md z-[10000] ${className}`,
          })}
        >
          {children}
        </div>
      )}
    </FloatingPortal>
  );
};
