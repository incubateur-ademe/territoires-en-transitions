import React, {useLayoutEffect, useState} from 'react';
import {
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react-dom-interactions';

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
  const {floating, context, strategy} = useFloating({
    open,
    strategy: 'fixed',
  });

  const {getFloatingProps} = useInteractions([useDismiss(context)]);

  const [toastWidth, setToastWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    setToastWidth(context.refs.floating.current?.getBoundingClientRect().width);
  });

  setTimeout(() => onClose(), autoHideDuration ?? 4000);

  return (
    <FloatingPortal>
      {open && (
        <div
          {...getFloatingProps({
            ref: floating,
            style: {
              position: strategy,
              maxWidth: '40rem',
              // rajout des 32px de margin left/right pour afficher des marges sur mobile
              left: `calc(50% - (${toastWidth}px + 32px) / 2 )`,
            },
            className: `mx-4 py-2 px-4 bottom-6 text-white bg-gray-800 rounded-md z-10 ${className}`,
          })}
        >
          {children}
        </div>
      )}
    </FloatingPortal>
  );
};
