import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  offset,
  OffsetOptions,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useInteractions,
} from '@floating-ui/react';
import { cloneElement, CSSProperties, JSX, useState } from 'react';
import { flushSync } from 'react-dom';
import { useOpenState } from '../../../hooks/use-open-state';
import { preset } from '../../../tailwind-preset';
import { cn } from '../../../utils/cn';
import { OpenState } from '../../../utils/types';

export type DropdownFloaterProps = {
  /** Élement qui reçoit la fonction d'ouverture du dropdown */
  children: JSX.Element;
  /** Permet de définir et d'afficher le contenu du dropdown */
  render: (data: { close: () => void }) => React.ReactNode;
  /** Permet de contrôler l'ouverture de la modale */
  openState?:
    | OpenState
    | {
        isOpen: boolean;
      };
  /** Pour que la largeur des options soit égale au bouton d'ouverture. Défaut `true` */
  containerWidthMatchButton?: boolean;
  /** Placement offset */
  offsetValue?: OffsetOptions;
  /** ClassName pour le container avec fond blanc  */
  containerClassName?: string;
  /** z-index custom pour le dropdown */
  dropdownZindex?: number;
  /**
   * Permet d'afficher les options à la suite du bouton d'ouverture, sans portal ni position.
   * Soit en donnant un simple boolean, soit en donnant un objet avec la propriété maxHeight.
   */
  inlineEdit?:
    | boolean
    | {
        maxHeight?: CSSProperties['maxHeight'];
      };
  'data-test'?: string;
  disabled?: boolean;
  /** Indique qu'un bouton trigger personnalisé est utilisé (ajoute border-top et radius complet) */
  hasTriggerButton?: boolean;
  /** Largeur maximale du container d'options */
  containerMaxWidth?: CSSProperties['maxWidth'];
  /** Hauteur maximale, limitée également par l'espace disponible à l'écran. */
  containerMaxHeight?: CSSProperties['maxHeight'];
  /** Affiche le dropdown hors d'un parent scrollable, même dans une modale. */
  renderInPortal?: boolean;
};

/** Affiche un élement volant (dropdown, modal...) avec une configuration floating-ui prédéfinie */
export const DropdownFloater = ({
  render,
  children,
  openState,
  containerWidthMatchButton = true,
  offsetValue = 4,
  disabled,
  containerClassName,
  dropdownZindex,
  inlineEdit = false,
  hasTriggerButton = false,
  containerMaxWidth,
  containerMaxHeight,
  renderInPortal = false,
  'data-test': dataTest,
}: DropdownFloaterProps) => {
  const { isOpen, toggleIsOpen } = useOpenState(openState);

  const [maxHeight, setMaxHeight] = useState<number>();
  const [minHeight, setMinHeight] = useState(0);

  const nodeId = useFloatingNodeId();

  /** si l'id n'est pas null alors le DropdownFloater est contenu dans un élément
   * où le floating node est déjà présent (par exemple dans une modale) */
  const parentNodeId = useFloatingParentNodeId();

  const { x, y, strategy, refs, context } = useFloating({
    nodeId,
    open: disabled ? false : isOpen,
    onOpenChange: disabled ? () => null : toggleIsOpen,
    placement: 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      renderInPortal && flip(),
      shift(),
      size({
        apply({ rects, elements, availableHeight }) {
          // https://floating-ui.com/docs/size
          flushSync(() => {
            setMaxHeight(availableHeight);
            if (availableHeight < 80 && rects.floating.height > availableHeight)
              setMinHeight(rects.floating.height);
          });
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            width: containerWidthMatchButton
              ? `${rects.reference.width}px`
              : 'auto',
            ...(containerMaxWidth ? { maxWidth: containerMaxWidth } : {}),
          });
        },
      }),
    ],
  });

  const click = useClick(context, {
    keyboardHandlers: false,
  });

  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const isInlineEdit = !!inlineEdit;

  const getFloatingStyle = (isInlineEdit: boolean): CSSProperties => {
    if (isInlineEdit) {
      return {
        maxHeight:
          typeof inlineEdit === 'object' ? inlineEdit.maxHeight : '24rem',
      };
    }
    return {
      position: strategy,
      top: y,
      left: x,
      // Let flip measure the requested height before constraining it to the
      // available space; a zero-height first render can falsely fit below.
      maxHeight:
        maxHeight === undefined
          ? containerMaxHeight
          : containerMaxHeight
          ? `min(${
              typeof containerMaxHeight === 'number'
                ? `${containerMaxHeight}px`
                : containerMaxHeight
            }, ${Math.max(0, maxHeight - 16)}px)`
          : maxHeight - 16,
      minHeight,
      borderWidth: 1,
      borderColor: preset.theme.extend.colors.grey[4],
      borderTopWidth: hasTriggerButton ? 1 : 0,
    };
  };

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({
          ref: refs.setReference,
          isOpen,
          ...children.props,
        })
      )}
      <FloatingNode id={nodeId}>
        {isOpen && (
          <FloaterContent
            parentNodeId={parentNodeId}
            isInlineEdit={isInlineEdit}
            renderInPortal={renderInPortal}
          >
            <FloatingFocusManager
              context={context}
              initialFocus={-1}
              modal={parentNodeId ? true : false}
            >
              <div
                data-test={dataTest}
                {...getFloatingProps({
                  ref: refs.setFloating,
                  style: {
                    ...getFloatingStyle(isInlineEdit),
                    // A nested portal leaves the modal's stacking context.
                    zIndex:
                      dropdownZindex ??
                      (parentNodeId && renderInPortal
                        ? Number(preset.theme.extend.zIndex.modal) + 1
                        : preset.theme.extend.zIndex.dropdown),
                  },
                  className: cn(
                    'overflow-y-auto bg-white',
                    hasTriggerButton ? 'rounded-lg' : 'rounded-b-lg',
                    containerClassName
                  ),
                })}
              >
                {render({
                  close: () => toggleIsOpen(),
                })}
              </div>
            </FloatingFocusManager>
          </FloaterContent>
        )}
      </FloatingNode>
    </>
  );
};

type Props = {
  children: JSX.Element;
  parentNodeId: string | null;
  isInlineEdit: boolean;
  renderInPortal: boolean;
};

/** Permet de rendre le dropdown dans un portal ou non si un parent existe déjà */
const FloaterContent = ({
  children,
  parentNodeId,
  isInlineEdit,
  renderInPortal,
}: Props) => {
  if (isInlineEdit || (parentNodeId && !renderInPortal)) {
    return children;
  } else {
    return <FloatingPortal>{children}</FloatingPortal>;
  }
};
