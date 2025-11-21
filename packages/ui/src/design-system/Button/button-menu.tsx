import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  size,
  useClick,
  useDismiss,
  useFloating,
  useHover,
  UseHoverProps,
  useInteractions,
} from '@floating-ui/react';
import { cloneElement, useState } from 'react';

import { useOpenState } from '@/ui/hooks/use-open-state';
import { flushSync } from 'react-dom';
import { cn } from '../../utils/cn';
import { OpenState } from '../../utils/types';
import { Icon } from '../Icon';
import { Button } from './Button';
import { ButtonProps } from './types';

export type MenuAction = {
  label: string;
  onClick: () => void;
  icon?: string;
  /** True par défaut */
  isVisible?: boolean;
};

type Props = {
  menu: {
    /** Classe CSS à appliquer au container du menu */
    className?: string;
    /** Actions du menu */
    actions?: MenuAction[];
    /** Contenu à afficher au début du menu */
    startContent?: React.ReactNode;
    /** Contenu à afficher à la fin du menu */
    endContent?: React.ReactNode;
    /** Rend le composant controllable */
    openState?: OpenState;
    /** Ouvre le menu au hover */
    hoverConfig?: UseHoverProps;
    /** Placement du menu par rapport au bouton */
    placement?: Placement;
  };
  /** Affiche une flèche signalant l'ouverture du menu */
  withArrow?: boolean;
} & ButtonProps;

export const ButtonMenu = ({ menu, withArrow, children, ...props }: Props) => {
  const {
    openState,
    className: menuClassName,
    placement,
    hoverConfig,
    actions,
    startContent,
    endContent,
  } = menu;
  const { isOpen, toggleIsOpen } = useOpenState(openState);

  const [maxHeight, setMaxHeight] = useState(0);

  const { refs, context, x, y, strategy } = useFloating({
    open: isOpen,
    onOpenChange: toggleIsOpen,
    whileElementsMounted: autoUpdate,
    placement: placement ?? 'bottom-end',
    middleware: [
      offset(8),
      flip(),
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
    useHover(context, hoverConfig ?? { enabled: false }),
  ]);

  return (
    <>
      {cloneElement(
        <Button {...props}>
          {(children || withArrow) && (
            <>
              {children}
              {withArrow && (
                <Icon
                  icon="arrow-down-s-line"
                  size="sm"
                  className={cn('ml-1 transition-all', {
                    'rotate-180': isOpen,
                  })}
                />
              )}
            </>
          )}
        </Button>,
        getReferenceProps({
          ref: refs.setReference,
        })
      )}
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
                'max-w-64 relative overflow-y-auto flex flex-col gap-2 p-2 border border-grey-2 rounded-md bg-white shadow z-[1]',
                menuClassName
              ),
            })}
          >
            {startContent}
            {actions && (
              <div className="flex flex-col">
                {actions.map((action) => (
                  <MenuAction
                    key={action.label}
                    {...action}
                    onClick={() => {
                      toggleIsOpen();
                      action.onClick();
                    }}
                  />
                ))}
              </div>
            )}
            {endContent && (
              <>
                <div className="h-px mx-2 bg-grey-3 last:hidden" />
                {endContent}
              </>
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

const MenuAction = ({ icon, label, onClick, isVisible = true }: MenuAction) => {
  if (!isVisible) {
    return null;
  }

  return (
    <button
      className="flex items-baseline gap-3 py-2 px-3 text-primary-9 text-sm text-left rounded hover:!bg-primary-1"
      onClick={onClick}
    >
      {icon && <Icon icon={icon} size="sm" className="-mt-0.5" />}
      {label}
    </button>
  );
};
