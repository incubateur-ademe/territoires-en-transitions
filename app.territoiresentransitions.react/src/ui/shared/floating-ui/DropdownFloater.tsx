import {cloneElement, useState} from 'react';
import {
  useFloating,
  offset,
  useInteractions,
  useDismiss,
  shift,
  useClick,
  FloatingPortal,
  FloatingFocusManager,
  Placement,
  autoUpdate,
  size,
} from '@floating-ui/react';

type DropdownFloaterProps = {
  children: JSX.Element;
  render: (data: {close: () => void}) => React.ReactNode;
  placement?: Placement;
  'data-test'?: string;
};

const DropdownFloater = ({
  render,
  children,
  placement,
  'data-test': dataTest,
}: DropdownFloaterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = (open: boolean) => setIsOpen(open);

  const {x, y, strategy, reference, floating, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: placement ?? 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      shift(),
      size({
        apply({rects, elements}) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const click = useClick(context, {keyboardHandlers: false});
  const dismiss = useDismiss(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({
          ref: reference,
          isOpen,
          toggleOpen,
          onKeyDown(evt) {
            if (evt.key === 'Enter' && evt.target instanceof HTMLInputElement) {
              setIsOpen(!isOpen);
            }
          },
          ...children.props,
        })
      )}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
          >
            <div
              data-test={dataTest}
              className="w-max bg-white shadow-md z-50"
              {...getFloatingProps({
                ref: floating,
                style: {
                  position: strategy,
                  top: y ?? '',
                  left: x ?? '',
                },
              })}
            >
              {render({
                close: () => setIsOpen(false),
              })}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
};

export default DropdownFloater;
