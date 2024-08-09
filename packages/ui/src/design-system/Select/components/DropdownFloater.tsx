import {
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  OffsetOptions,
  Placement,
  autoUpdate,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useInteractions,
} from '@floating-ui/react';
import { preset } from '@tet/ui/tailwind-preset';
import classNames from 'classnames';
import { cloneElement, useState } from 'react';
import { flushSync } from 'react-dom';

type DropdownFloaterProps = {
  /** Élement qui reçoit la fonction d'ouverture du dropdown */
  children: JSX.Element;
  /** Permet de définir et d'afficher le contenu du dropdown */
  render: (data: { close: () => void }) => React.ReactNode;
  /** Id du parent dans lequel doit être rendu le portal */
  parentId?: string;
  /** Où le dropdown doit apparaître par rapport à l'élement d'ouverture */
  placement?: Placement;
  /** Pour que la largeur des options soit égale au bouton d'ouverture. Défaut `false` */
  containerWidthMatchButton?: boolean;
  /** Placement offset */
  offsetValue?: OffsetOptions;
  /** ClassName pour le container avec fond blanc  */
  containerClassName?: string;
  'data-test'?: string;
  disabled?: boolean;
};

/** Affiche un élement volant (dropdown, modal...) avec une configuration floating-ui prédéfinie */
export const DropdownFloater = ({
  render,
  children,
  parentId,
  placement,
  containerWidthMatchButton = false,
  offsetValue = 4,
  disabled,
  containerClassName,
  'data-test': dataTest,
}: DropdownFloaterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const [maxHeight, setMaxHeight] = useState(0);

  const nodeId = useFloatingNodeId();

  const { x, y, strategy, refs, context } = useFloating({
    nodeId,
    open: disabled ? false : isOpen,
    onOpenChange: disabled ? () => null : setIsOpen,
    placement: placement ?? 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      shift(),
      size({
        apply({ rects, elements, availableHeight }) {
          // https://floating-ui.com/docs/size
          flushSync(() => setMaxHeight(availableHeight));
          Object.assign(elements.floating.style, {
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

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  /** si l'id n'est pas null alors le DropdownFloater est contenu dans un élément
   * où le floating node est déjà présent (par exemple dans une modale) */
  const parentNodeId = useFloatingParentNodeId();

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
          <FloaterContent parentId={parentId} parentNodeId={parentNodeId}>
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
                    position: strategy,
                    top: y,
                    left: x,
                    // Applique uniquement le z-index quand le dropdown
                    // n'est pas contenu dans un autre floater (ex. modale)
                    zIndex: parentNodeId ?? preset.theme.extend.zIndex.dropdown,
                  },
                })}
              >
                <div
                  className={classNames(
                    'overflow-y-auto bg-white rounded-b-lg border border-grey-4 border-t-0',
                    containerClassName
                  )}
                  style={{ maxHeight: maxHeight - 16 }}
                >
                  {render({
                    close: () => setIsOpen(false),
                  })}
                </div>
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
  /** Id custom de l'élément dans lequel rendre le portal si donné */
  parentId?: string;
  parentNodeId: string | null;
};

/** Permet de rendre le dropdown dans un portal ou non si un parent existe déjà */
const FloaterContent = ({ children, parentId, parentNodeId }: Props) => {
  if (parentNodeId) {
    return children;
  } else {
    return <FloatingPortal id={parentId}>{children}</FloatingPortal>;
  }
};
