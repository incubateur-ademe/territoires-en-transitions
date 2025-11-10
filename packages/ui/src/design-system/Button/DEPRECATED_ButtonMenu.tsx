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
  useHover,
  UseHoverProps,
  useInteractions,
} from '@floating-ui/react';
import classNames from 'classnames';
import { cloneElement, useState } from 'react';
import { flushSync } from 'react-dom';

import { cn } from '../../utils/cn';
import { OpenState } from '../../utils/types';
import { Icon } from '../Icon';
import { Button } from './Button';
import { ButtonProps } from './types';

export type DEPRECATED_ButtonMenuProps = {
  /** Le contenu du menu */
  children: React.ReactNode;
  /** Placement du menu pour l'élément floating-ui */
  menuPlacement?: Placement;
  /** Classe CSS à appliquer au container du menu */
  menuContainerClassName?: string;
  /** Rend le composant controllable */
  openState?: OpenState;
  /** Ouvre le menu au hover */
  hoverConfig?: UseHoverProps;
  /** Permet de donner un label ou du HTML au bouton d'ouverture car children est déjà utilisé pour le contenu du menu */
  text?: string | React.ReactNode;
  /** Affiche une flèche signalant l'ouverture du menu */
  withArrow?: boolean;
} & ButtonProps;

/**
 * Ouverture d'un menu flottant au click sur le bouton.
 *
 * Ne pas oublier de donner une largeur fixe au menu s'il contient des élements qui peuvent être resizer comme un sélecteur avec une valeur.
 */
export const DEPRECATED_ButtonMenu = ({
  menuPlacement = 'bottom-end',
  openState,
  children,
  text,
  withArrow,
  menuContainerClassName,
  hoverConfig = { enabled: false },
  ...props
}: DEPRECATED_ButtonMenuProps) => {
  const isControlled = !!openState;
  const [open, setOpen] = useState(false);

  const isOpen = isControlled ? openState.isOpen : open;

  const handleOpenChange = () => {
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
    useHover(context, hoverConfig),
  ]);

  const hasScroll =
    refs.floating.current?.scrollHeight !== undefined &&
    refs.floating.current?.clientHeight !== undefined &&
    refs.floating.current.scrollHeight > refs.floating.current.clientHeight;

  return (
    <>
      {cloneElement(
        <Button
          {...props}
          children={
            text || withArrow ? (
              <>
                {text && <span className="line-clamp-1">{text}</span>}
                {withArrow && (
                  <Icon
                    icon="arrow-down-s-line"
                    size="sm"
                    className={classNames('ml-2 transition-all', {
                      'rotate-180': isOpen,
                    })}
                  />
                )}
              </>
            ) : undefined
          }
        />,
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
                className: cn(
                  'relative z-[1] overflow-y-auto bg-white rounded-b-lg border border-grey-4 rounded-lg shadow-card',
                  menuContainerClassName
                ),
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
