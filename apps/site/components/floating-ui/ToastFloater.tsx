// Composant copié depuis l'app

import {
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';

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
  const {
    context,
    strategy,
    // Déstructuré ici : la règle `react-hooks/refs` prend tout ce qui s'appelle
    // `refs` pour une ref, alors que c'est un callback de montage.
    refs: { setFloating },
  } = useFloating({
    open,
    strategy: 'fixed',
  });

  const { getFloatingProps } = useInteractions([useDismiss(context)]);

  const [toastWidth, setToastWidth] = useState<number | undefined>(undefined);

  // La largeur sert à centrer le toast en tenant compte de ses marges. Elle se
  // mesure au montage du nœud, dans le callback de ref : un effet la lirait
  // dans une ref et la recopierait dans l'état à chaque rendu.
  const mesurerToast = useCallback(
    (node: HTMLElement | null) => {
      setFloating(node);
      setToastWidth(node?.getBoundingClientRect().width);
    },
    [setFloating]
  );

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
            ref: mesurerToast,
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
