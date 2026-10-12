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
  useCallback,
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
  /** Return false (or reject) to keep the editor open; void allows closing. */
  onClose?: () => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
  floatingMatchReferenceHeight?: boolean;
};

const useInlineEditOpenState = ({
  openState,
  onClose,
  disabled,
}: Pick<
  InlineEditWrapperProps,
  'openState' | 'onClose' | 'disabled'
>): OpenState => {
  const { isOpen, setIsOpen } = useOpenState(openState);
  const openChangeVersionRef = useRef(0);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      if (disabled) return;
      const version = ++openChangeVersionRef.current;
      if (!open && onClose) {
        try {
          const result = onClose();
          // Keep synchronous callers synchronous, including cancellation.
          const canClose = result instanceof Promise ? await result : result;
          if (canClose === false) return;
        } catch {
          // The caller owns error feedback; a failed save must preserve the draft.
          return;
        }
      }

      // A late save must not close an editor that has since been reopened.
      if (version === openChangeVersionRef.current) {
        setIsOpen(open);
      }
    },
    [disabled, onClose, setIsOpen]
  );

  return { isOpen, setIsOpen: handleOpenChange };
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
}: InlineEditWrapperProps) => {
  const { isOpen, setIsOpen: handleOpenChange } = useInlineEditOpenState({
    openState,
    onClose,
    disabled,
  });

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

  const isChildrenFunction = typeof children === 'function';
  const childProps = (
    isChildrenFunction ? {} : children.props
  ) as HTMLAttributes<HTMLElement>;
  const referenceTabIndex = disabled
    ? childProps.tabIndex
    : childProps.tabIndex === -1 || childProps.tabIndex === undefined
    ? 0
    : childProps.tabIndex;

  const inlineProps = getReferenceProps({
    ref: refs.setReference,
    ...childProps,
    tabIndex: referenceTabIndex,
    className: cn(
      'cursor-pointer',
      { 'cursor-default': disabled },
      isChildrenFunction ? undefined : children.props.className
    ),
  });
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
                  style: {
                    position: strategy,
                    top: y,
                    left: x,
                    minWidth: `min(${
                      refs.reference?.current?.getBoundingClientRect().width
                    }px, 100vw)`,
                    maxWidth: '100vw',
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
