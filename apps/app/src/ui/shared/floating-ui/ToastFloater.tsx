import React, { useCallback, useEffect, useEffectEvent, useState } from 'react';
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
  // mesure au montage du nœud, dans le callback de ref : l'effet précédent la
  // lisait dans une ref et la recopiait dans l'état à chaque rendu.
  const mesurerToast = useCallback(
    (node: HTMLElement | null) => {
      setFloating(node);
      setToastWidth(node?.getBoundingClientRect().width);
    },
    [setFloating]
  );

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
            ref: mesurerToast,
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
