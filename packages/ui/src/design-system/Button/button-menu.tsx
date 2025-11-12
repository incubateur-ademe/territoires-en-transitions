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
import { cloneElement, Fragment, useState } from 'react';

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
};

export type MenuSection = MenuAction[] | React.ReactNode;

function isActionsSection(section: MenuSection): section is MenuAction[] {
  return Array.isArray(section);
}

type Props = {
  menu: {
    /** Classe CSS à appliquer au container du menu */
    className?: string;
    /** Contenu du menu */
    sections: MenuSection[];
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
    sections,
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
            {sections.map((section, i) =>
              isActionsSection(section) ? (
                <Fragment key={i}>
                  <div className="flex flex-col">
                    {section.map((action) => (
                      <MenuItem
                        key={action.label}
                        {...action}
                        onClick={() => {
                          toggleIsOpen();
                          action.onClick();
                        }}
                      />
                    ))}
                  </div>
                  <div className="h-px mx-2 bg-grey-3 last:hidden" />
                </Fragment>
              ) : (
                section
              )
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

const MenuItem = ({ icon, label, onClick }: MenuAction) => (
  <button
    className="flex items-baseline gap-3 py-2 px-3 text-primary-9 text-sm text-left rounded hover:!bg-primary-1"
    onClick={onClick}
  >
    {icon && <Icon icon={icon} size="sm" className="-mt-0.5" />}
    {label}
  </button>
);
