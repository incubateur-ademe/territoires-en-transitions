import {
  autoUpdate,
  FloatingFocusManager,
  FloatingNode,
  FloatingOverlay,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useInteractions,
} from '@floating-ui/react';
import {
  cloneElement,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useOpenState } from '../../hooks/use-open-state';
import { preset } from '../../tailwind-preset';
import { cn } from '../../utils/cn';
import { OpenState } from '../../utils/types';

export type InlineEditWrapperProps = {
  children:
    | React.ReactElement<HTMLAttributes<HTMLElement>>
    | ((props: React.ComponentProps<'button'>) => React.ReactNode);
  renderOnEdit: ({ openState }: { openState: OpenState }) => React.ReactNode;
  openState?: OpenState;
  onClose?: () => void;
  disabled?: boolean;
  floatingMatchReferenceHeight?: boolean;
  /**
   * Ferme l'édition sur Tab et poursuit l'édition sur l'élément éditable
   * suivant (Maj+Tab pour le précédent), comme dans un tableur.
   */
  tabNavigation?: boolean;
};

const TAB_NAVIGATION_SELECTOR = '[data-inline-edit-tab="true"]';

/**
 * Chaque élément éditable gère son propre état d'ouverture : on retrouve ses
 * voisins dans l'ordre du DOM plutôt que via un registre partagé, pour que la
 * tabulation marche sans câblage côté appelant. Le périmètre est le tableau
 * courant, ou un conteneur explicitement marqué `data-inline-edit-group`.
 */
const findEditableSibling = (
  reference: HTMLElement,
  direction: 1 | -1
): HTMLElement | null => {
  const scope =
    reference.closest<HTMLElement>('[data-inline-edit-group]') ??
    reference.closest<HTMLElement>('table') ??
    reference.ownerDocument.body;

  const editables = Array.from(
    scope.querySelectorAll<HTMLElement>(TAB_NAVIGATION_SELECTOR)
  );
  const index = editables.indexOf(reference);

  return index === -1 ? null : (editables[index + direction] ?? null);
};

/**
 * Makes any wrapped element clickable and focusable.
 * Displays a floating element above the clicked one to show editable content.
 */
export const InlineEditWrapper = ({
  children,
  renderOnEdit,
  onClose,
  disabled,
  openState,
  floatingMatchReferenceHeight = true,
  tabNavigation = false,
}: InlineEditWrapperProps) => {
  const { isOpen, setIsOpen } = useOpenState(openState);

  const handleOpenChange = (open: boolean) => {
    if (disabled) return;
    if (!open && onClose) {
      onClose();
    }

    setIsOpen(open);
  };

  const [internalMaxHeight, setInternalMaxHeight] = useState(0);

  const nodeId = useFloatingNodeId();

  const { refs, context, x, y, strategy } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start',
    middleware: [
      offset(({ rects }) => -rects.reference.height),
      shift({
        crossAxis: true,
      }),
      size({
        apply({ availableHeight }) {
          setInternalMaxHeight(availableHeight);
        },
      }),
    ],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  const pendingTabTargetRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;

    const tabTarget = pendingTabTargetRef.current;
    pendingTabTargetRef.current = null;
    const reference = refs.domReference.current as HTMLElement | null;

    // L'éditeur flottant est démonté dans ce commit : on reprend la main à la
    // frame suivante, une fois que floating-ui a fini de restituer le focus.
    const frame = requestAnimationFrame(() => {
      if (tabTarget) {
        tabTarget.focus();
        // Rouvre l'édition sur la cellule suivante, comme un tableur.
        tabTarget.click();
        return;
      }

      const activeElement = reference?.ownerDocument.activeElement;
      const isFocusLost =
        !activeElement || activeElement === reference?.ownerDocument.body;
      if (isFocusLost) {
        reference?.focus();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, refs.domReference]);

  const handleFloatingKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!tabNavigation || event.key !== 'Tab') return;

    const reference = refs.domReference.current as HTMLElement | null;
    const tabTarget =
      reference && findEditableSibling(reference, event.shiftKey ? -1 : 1);
    if (!tabTarget) return;

    // Sans ça, le piège à focus de l'éditeur flottant garde la tabulation.
    event.preventDefault();
    pendingTabTargetRef.current = tabTarget;
    handleOpenChange(false);
  };

  const isChildrenFunction = typeof children === 'function';
  const childProps = (
    isChildrenFunction ? {} : children.props
  ) as HTMLAttributes<HTMLElement>;
  const referenceTabIndex = disabled
    ? childProps.tabIndex
    : childProps.tabIndex === -1 || childProps.tabIndex === undefined
      ? 0
      : childProps.tabIndex;

  const inlineProps: HTMLAttributes<HTMLElement> & Record<string, unknown> = {
    ...getReferenceProps({
      ref: refs.setReference,
      ...childProps,
      tabIndex: referenceTabIndex,
      className: cn(
        'cursor-pointer',
        { 'cursor-default': disabled },
        isChildrenFunction ? undefined : children.props.className
      ),
    }),
    // Repère les voisins atteignables à la tabulation depuis l'éditeur ouvert.
    'data-inline-edit-tab': tabNavigation && !disabled ? 'true' : undefined,
  };
  return (
    <>
      {isChildrenFunction
        ? children({ disabled, ...inlineProps })
        : cloneElement(children, inlineProps)}
      {renderOnEdit && isOpen && (
        <FloatingNode id={nodeId}>
          <FloatingPortal>
            <FloatingOverlay lockScroll />
            <FloatingFocusManager context={context}>
              <div
                className="flex flex-col border border-grey-3 rounded-md bg-white shadow-md z-10"
                {...getFloatingProps({
                  ref: refs.setFloating,
                  onKeyDown: handleFloatingKeyDown,
                  style: {
                    position: strategy,
                    top: y,
                    left: x,
                    minWidth: `${
                      refs.reference?.current?.getBoundingClientRect().width
                    }px`,
                    minHeight: floatingMatchReferenceHeight
                      ? `${
                          refs.reference?.current?.getBoundingClientRect()
                            .height
                        }px`
                      : undefined,
                    maxHeight: internalMaxHeight, // set by floating-ui size middleware to calculate available space within the viewport
                    zIndex: preset.theme.extend.zIndex.modal,
                  },
                })}
              >
                {renderOnEdit?.({
                  openState: { isOpen, setIsOpen: handleOpenChange },
                })}
              </div>
            </FloatingFocusManager>
          </FloatingPortal>
        </FloatingNode>
      )}
    </>
  );
};
