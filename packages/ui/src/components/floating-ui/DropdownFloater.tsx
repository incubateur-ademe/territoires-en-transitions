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
  OffsetOptions,
} from '@floating-ui/react';
import classNames from 'classnames';

type DropdownFloaterProps = {
  /** Élement qui reçoit la fonction d'ouverture du dropdown */
  children: JSX.Element;
  /** Permet de définir et d'afficher le contenu du dropdown */
  render: (data: {close: () => void}) => React.ReactNode;
  /** Où le dropdown doit apparaître par rapport à l'élement d'ouverture */
  placement?: Placement;
  /** Toggle l'état d'ouverture en appuyant sur la touche 'space'. Défaut `true` */
  spaceToToggle?: boolean;
  /** Toggle l'état d'ouverture en appuyant sur la touche 'enter'. Défaut `true` */
  enterToToggle?: boolean;
  /** Pour que la largeur des options soit égale au bouton d'ouverture. Défaut `false` */
  containerWidthMatchButton?: boolean;
  /** Placement offset */
  offsetValue?: OffsetOptions;
  /** z-index */
  zIndex?: number;
  /** Supprime les styles du dropdown */
  noDropdownStyles?: boolean;
  'data-test'?: string;
  disabled?: boolean;
};

/** Affiche un élement volant (dropdown, modal...) avec une configuration floating-ui prédéfinie */
const DropdownFloater = ({
  render,
  children,
  placement,
  spaceToToggle = true,
  enterToToggle = true,
  containerWidthMatchButton = false,
  offsetValue = 4,
  zIndex,
  noDropdownStyles = false,
  disabled,
  'data-test': dataTest,
}: DropdownFloaterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const {x, y, strategy, refs, context} = useFloating({
    open: disabled ? false : isOpen,
    onOpenChange: disabled ? () => null : setIsOpen,
    placement: placement ?? 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      shift(),
      size({
        apply({rects, elements, availableHeight}) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            overflowY: 'auto',
            minWidth: `${rects.reference.width}px`,
            width: containerWidthMatchButton
              ? `${rects.reference.width}px`
              : 'auto',
          });
        },
      }),
    ],
  });

  const click = useClick(context, {
    keyboardHandlers: false,
  });
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
          ref: refs.setReference,
          isOpen,
          onKeyDown(evt) {
            if (
              enterToToggle &&
              evt.key === 'Enter' &&
              evt.target instanceof HTMLInputElement
            ) {
              setIsOpen(!isOpen);
            }
            if (
              spaceToToggle &&
              evt.key === ' ' &&
              evt.target instanceof HTMLInputElement
            ) {
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
              className={classNames({
                'w-max bg-white shadow-md': !noDropdownStyles,
              })}
              {...getFloatingProps({
                ref: refs.setFloating,
                style: {
                  position: strategy,
                  top: y ?? '',
                  left: x ?? '',
                  zIndex,
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
