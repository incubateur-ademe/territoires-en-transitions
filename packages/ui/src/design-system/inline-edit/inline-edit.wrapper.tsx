import {
  autoUpdate,
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import {
  cloneElement,
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
  type RefAttributes,
} from 'react';
 import { useOpenState } from '../../hooks/use-open-state';
import { preset } from '../../tailwind-preset';
import { cn } from '../../utils/cn';
import { mergeRefs } from '../../utils/merge-refs';
import { OpenState } from '../../utils/types';
penState } from '../../utils/types';

export type InlineEditWrapperProps = {
  children:
    | React.ReactElement<HTMLAttributes<HTMLElement>>
    | ((props: React.ComponentProps<'button'>) => React.ReactNode);
  renderOnEdit: ({ openState }: { openState: OpenState }) => React.ReactNode;
  openState?: OpenState;
  onClose?: () => void;
  disabled?: boolean;
  floatingMatchReferenceHeight?: boolean;
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
  const { isOpen, setIsOpen } = useOpenState(openState);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(
    null
  );
  const wasOpenRef = useRef(isOpen);

  const handleOpenChange = (open: boolean) => {
    if (disabled) return;
    if (!open && onClose) {
      onClose();
    }

    setIsOpen(open);
  };

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      requestAnimationFrame(() => {
        triggerElement?.focus();
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, triggerElement]);

  const nodeId = useFloatingNodeId()

  const [maxHeight, setMaxHeight] = useState(0);

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
  const childProps = isChildrenFunction ? {} : children.props;
  const { ref: childRef, ...childPropsRest } =
    childProps as HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;
  const inlineProps = getReferenceProps({
    ref: mergeRefs(refs.setReference, childRef),
    tabIndex: disabled ? undefined : 0,
    onMouseDownCapture: (event) => {
      setTriggerElement(event.currentTarget as HTMLElement);
    },
    onKeyDownCapture: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        setTriggerElement(event.currentTarget as HTMLElement);
      }
    },
    ...childPropsRest,
    className: cn(
      'cursor-pointer',
      'data-[inline-edit=true]:hover:bg-primary-2/40',
      'transition-colors',
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
