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
  useEffectEvent,
  useRef,
  useState,
} from 'react';

import { useOpenState } from '../../hooks/use-open-state';
import { preset } from '../../tailwind-preset';
import { cn } from '../../utils/cn';
import { OpenState } from '../../utils/types';

export type InlineEditCloseReason = 'commit' | 'cancel' | 'dismiss';

export type InlineEditRenderProps = {
  openState: OpenState;
  /** Ferme l'éditeur. Par défaut `commit` (déclenche `onClose`). */
  close: (reason?: InlineEditCloseReason) => void;
};

export type InlineEditWrapperProps = {
  children:
    | React.ReactElement<HTMLAttributes<HTMLElement>>
    | ((props: React.ComponentProps<'button'>) => React.ReactNode);
  renderOnEdit: (props: InlineEditRenderProps) => React.ReactNode;
  openState?: OpenState;
  onClose?: (reason: InlineEditCloseReason) => void;
  disabled?: boolean;
  floatingMatchReferenceHeight?: boolean;
  /**
   * Ferme l'édition sur Tab et poursuit l'édition sur l'élément éditable
   * suivant (Maj+Tab pour le précédent), comme dans un tableur.
   */
  tabNavigation?: boolean;
};

/**
 * Enter valide, sauf s'il sert à aller à la ligne (textarea + Maj, ou
 * contenteditable sans Ctrl/Cmd). Un `preventDefault` côté input bloque
 * la fermeture — c'est le seul câblage éventuellement nécessaire.
 */
const shouldCommitOnEnter = (event: React.KeyboardEvent): boolean => {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
    return false;
  }
  if (event.defaultPrevented) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  if (target.isContentEditable) {
    return event.ctrlKey || event.metaKey;
  }

  if (target.tagName === 'TEXTAREA' && event.shiftKey) {
    return false;
  }

  return true;
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

  return index === -1 ? null : editables[index + direction] ?? null;
};

type InlineEditViewProps = {
  children: InlineEditWrapperProps['children'];
  renderOnEdit: InlineEditWrapperProps['renderOnEdit'];
  disabled?: boolean;
  tabNavigation: boolean;
  isOpen: boolean;
  handleOpenChange: (open: boolean, reason?: unknown) => void;
  close: (reason?: InlineEditCloseReason) => void;
  getReferenceElement: () => HTMLElement | null;
  setFloating: (node: HTMLElement | null) => void;
  nodeId: string;
  context: ReturnType<typeof useFloating>['context'];
  getReferenceProps: ReturnType<typeof useInteractions>['getReferenceProps'];
  getFloatingProps: ReturnType<typeof useInteractions>['getFloatingProps'];
  setReference: (node: HTMLElement | null) => void;
  floatingStyle: React.CSSProperties;
};

/**
 * Isolé du `useFloating` : ce composant possède les `useRef` de tabulation /
 * focus, et le parent peut poser les callback refs de floating-ui au rendu
 * sans que le compilateur React ne les confonde avec ces refs.
 */
const InlineEditView = ({
  children,
  renderOnEdit,
  disabled,
  tabNavigation,
  isOpen,
  handleOpenChange,
  close,
  getReferenceElement,
  setFloating,
  nodeId,
  context,
  getReferenceProps,
  getFloatingProps,
  setReference,
  floatingStyle,
}: InlineEditViewProps) => {
  const pendingTabTargetRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const getReference = useEffectEvent(getReferenceElement);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;

    const tabTarget = pendingTabTargetRef.current;
    pendingTabTargetRef.current = null;
    const reference = getReference();

    // Après le démontage du portail : floating-ui ne peut plus rendre le
    // focus à l'input (`returnFocus={false}`), il le perd sur body. On
    // reprend la cellule (ou la suivante si Tab a demandé à poursuivre).
    const timeout = window.setTimeout(() => {
      if (tabTarget) {
        tabTarget.focus();
        tabTarget.click();
        return;
      }
      reference?.focus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  const handleFloatingKeyDownCapture = (
    event: React.KeyboardEvent<HTMLElement>
  ) => {
    if (!tabNavigation || event.key !== 'Tab') return;

    const reference = getReferenceElement();
    const tabTarget =
      reference && findEditableSibling(reference, event.shiftKey ? -1 : 1);
    if (!tabTarget) return;

    // Capture : le piège à focus de FloatingFocusManager avale Tab avant bubble.
    event.preventDefault();
    event.stopPropagation();
    pendingTabTargetRef.current = tabTarget;
    close('commit');
  };

  const handleFloatingKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close('cancel');
      return;
    }

    if (shouldCommitOnEnter(event)) {
      event.preventDefault();
      close('commit');
    }
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
      ref: setReference,
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
          {/*
            Sans ça, `modal={false}` pose des FocusGuard <span> à côté de la
            cellule — enfants directs de <tr>, HTML invalide. La tabulation
            entre cellules est gérée ici, pas par le portail.
          */}
          <FloatingPortal preserveTabOrder={false}>
            <FloatingOverlay lockScroll />
            <FloatingFocusManager
              context={context}
              returnFocus={false}
              modal={false}
            >
              <div
                className="flex flex-col border border-grey-3 rounded-md bg-white shadow-md z-10"
                {...getFloatingProps({
                  style: floatingStyle,
                })}
                ref={setFloating}
                onKeyDownCapture={handleFloatingKeyDownCapture}
                onKeyDown={handleFloatingKeyDown}
              >
                {renderOnEdit?.({
                  openState: { isOpen, setIsOpen: handleOpenChange },
                  close,
                })}
              </div>
            </FloatingFocusManager>
          </FloatingPortal>
        </FloatingNode>
      )}
    </>
  );
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

  const handleOpenChange = (open: boolean, reason?: unknown) => {
    if (disabled) return;
    const closeReason: InlineEditCloseReason =
      reason === 'commit' || reason === 'cancel' || reason === 'dismiss'
        ? reason
        : 'dismiss';
    if (!open && onClose) {
      onClose(closeReason);
    }

    setIsOpen(open);
  };

  const close = (reason: InlineEditCloseReason = 'commit') => {
    handleOpenChange(false, reason);
  };

  const [internalMaxHeight, setInternalMaxHeight] = useState(0);
  const [referenceSize, setReferenceSize] = useState({ width: 0, height: 0 });

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
        apply({ availableHeight, rects }) {
          setInternalMaxHeight(availableHeight);
          setReferenceSize({
            width: rects.reference.width,
            height: rects.reference.height,
          });
        },
      }),
    ],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, { escapeKey: false }),
  ]);

  return (
    <InlineEditView
      renderOnEdit={renderOnEdit}
      disabled={disabled}
      tabNavigation={tabNavigation}
      isOpen={isOpen}
      handleOpenChange={handleOpenChange}
      close={close}
      getReferenceElement={() =>
        refs.domReference.current as HTMLElement | null
      }
      setFloating={refs.setFloating}
      nodeId={nodeId}
      context={context}
      getReferenceProps={getReferenceProps}
      getFloatingProps={getFloatingProps}
      setReference={refs.setReference}
      floatingStyle={{
        position: strategy,
        top: y ?? undefined,
        left: x ?? undefined,
        minWidth: `${referenceSize.width}px`,
        minHeight: floatingMatchReferenceHeight
          ? `${referenceSize.height}px`
          : undefined,
        maxHeight: internalMaxHeight, // set by floating-ui size middleware to calculate available space within the viewport
        zIndex: preset.theme.extend.zIndex.modal,
      }}
    >
      {children}
    </InlineEditView>
  );
};
