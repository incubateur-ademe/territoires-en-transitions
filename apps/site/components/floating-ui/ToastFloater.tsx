// Composant copié depuis l'app

import {
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import classNames from 'classnames';
import React, {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useState,
} from 'react';

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
  const updateToastWidth = useEffectEvent((value: number | undefined) =>
    setToastWidth(value)
  );

  useLayoutEffect(() => {
    updateToastWidth(
      context.refs.floating.current?.getBoundingClientRect().width
    );
  }, [context.refs.floating]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (open) {
      interval = setInterval(() => {
        onClose();
      }, autoHideDuration ?? 4000);
    }

    return () => clearInterval(interval);
  }, [open, autoHideDuration, onClose]);

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
            className: classNames(
              'mx-4 py-2 px-4 bottom-6 text-white bg-gray-800 rounded-md z-[10000]',
              className
            ),
          })}
        >
          {children}
        </div>
      )}
    </FloatingPortal>
  );
};
