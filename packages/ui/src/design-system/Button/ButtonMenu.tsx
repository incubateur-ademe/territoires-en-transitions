import {
  autoUpdate,
  FloatingNode,
  FloatingPortal,
  offset,
  Placement,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useInteractions,
} from '@floating-ui/react';
import { cloneElement, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { OpenState } from '../../utils/types';
import { Button } from './Button';
import { ButtonProps } from './types';

export type ButtonMenuProps = {
  /** Le contenu du menu */
  children: React.ReactNode;
  /** Placement du menu pour l'élément floating-ui */
  menuPlacement?: Placement;
  /** Rend le composant controllable.
   * Ne peut pas être utilisé avec openOnHover */
  openState?: OpenState;
  /** Permet de donner un text au bouton d'ouverture car children est déjà utilisé pour le contenu du menu */
  text?: string;
  /** Ouvre le menu au hover
   * Ne peut pas être utilisé avec openState */
  openOnHover?: boolean;
} & ButtonProps;

/**
 * Ouverture d'un menu flottant au click sur le bouton.
 *
 * Ne pas oublier de donner une largeur fixe au menu s'il contient des élements qui peuvent être resizer comme un sélecteur avec une valeur.
 */
export const ButtonMenu = ({
  menuPlacement = 'bottom-end',
  openState,
  children,
  text,
  openOnHover = false,
  ...props
}: ButtonMenuProps) => {
  if (!!openState && openOnHover) {
    throw new Error('openState and openOnHover cannot be used together');
  }

  const isControlled = !!openState;
  const [open, setOpen] = useState(false);

  const isOpen = isControlled ? openState.isOpen : open;

  const handleOpenChange = () => {
    // console.log(isOpen);
    if (isControlled) {
      openState.setIsOpen(!openState.isOpen);
    } else {
      setOpen(!open);
    }
  };

  const [maxHeight, setMaxHeight] = useState(0);

  const nodeId = useFloatingNodeId();

  const { refs, context, x, y, strategy } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement: menuPlacement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      shift(),
      size({
        apply({ availableHeight }) {
          // https://floating-ui.com/docs/size
          flushSync(() => setMaxHeight(availableHeight));
        },
      }),
    ],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  const hasScroll =
    refs.floating.current?.scrollHeight !== undefined &&
    refs.floating.current?.clientHeight !== undefined &&
    refs.floating.current.scrollHeight > refs.floating.current.clientHeight;

  const id = `${nodeId}-ref`;

  useEffect(() => {
    if (!openOnHover) {
      return;
    }

    const handleMouseEnter = () => setOpen(true);
    const handleMouseLeave = () => setOpen(false);

    const reference = document.getElementById(id);

    if (reference) {
      reference.addEventListener('mouseenter', handleMouseEnter);
      reference.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (reference) {
        reference.removeEventListener('mouseenter', handleMouseEnter);
        reference.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <>
      {cloneElement(
        <Button {...props} id={id} children={text} />,
        getReferenceProps({
          ref: refs.setReference,
        })
      )}
      <FloatingNode id={hasScroll ? nodeId : ''}>
        {isOpen && (
          <FloatingPortal>
            <div
              {...getFloatingProps({
                ref: refs.setFloating,
                style: {
                  position: strategy,
                  top: y,
                  left: x,
                  maxHeight: maxHeight - 16,
                },
                className:
                  'relative z-[1] overflow-y-auto bg-white rounded-b-lg border border-grey-4 rounded-lg shadow-card',
              })}
            >
              {children}
            </div>
          </FloatingPortal>
        )}
      </FloatingNode>
    </>
  );
};
