import {cloneElement, useLayoutEffect, useState} from 'react';
import {
  useFloating,
  offset,
  useInteractions,
  useDismiss,
  shift,
  useClick,
  FloatingPortal,
  useFocus,
  FloatingFocusManager,
  Placement,
} from '@floating-ui/react-dom-interactions';

type DropdownFloaterProps = {
  children: JSX.Element;
  render: (data: {close: () => void}) => React.ReactNode;
  placement?: Placement;
};

const DropdownFloater = ({
  render,
  children,
  placement,
}: DropdownFloaterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const {x, y, strategy, reference, floating, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: placement ?? 'bottom',
    middleware: [offset(4), shift()],
  });

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useClick(context),
    useDismiss(context),
    useFocus(context),
  ]);

  const [floatingMinWidth, setFloatingMinWidth] = useState<string | undefined>(
    undefined
  );

  useLayoutEffect(() => {
    setFloatingMinWidth(
      `${context.refs.reference.current?.getBoundingClientRect().width}px`
    );
  });

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({ref: reference, isOpen, ...children.props})
      )}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context}>
            <div
              className="w-max bg-white shadow-md z-40"
              {...getFloatingProps({
                ref: floating,
                style: {
                  position: strategy,
                  top: y ?? '',
                  left: x ?? '',
                  minWidth: floatingMinWidth,
                },
              })}
            >
              {render({
                close: () => {
                  setIsOpen(false);
                },
              })}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
};

export default DropdownFloater;
