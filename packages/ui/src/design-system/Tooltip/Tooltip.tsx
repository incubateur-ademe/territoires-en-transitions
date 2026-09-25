import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  Placement,
  ReferenceType,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import classNames from 'classnames';
import { cloneElement, JSX, useCallback, useState } from 'react';
import { preset } from '../../tailwind-preset';

const colorTheme = preset.theme.extend.colors;

export type TooltipProps = {
  /** Élément sur lequel s'applique l'info-bulle */
  children: JSX.Element;
  /** Libellé de l'info-bulle (chaîne de caractère ou composant) */
  label: string | React.ReactNode;
  /** Valeur de décalage de la tooltip */
  offsetValue?: number;
  /** Événement déclenchant l'affichage de l'info-bulle */
  activatedBy?: 'click' | 'hover';
  /** Délai d'ouverture de la tooltip */
  openingDelay?: number;
  /** Délai de fermeture de la tooltip */
  closingDelay?: number;
  /** Position de la tooltip */
  placement?: Placement;
  /** Affichage d'une flèche sur la tooltip */
  withArrow?: boolean;
  /** Surchage des classnames de la tooltip */
  className?: string;
};

/**
 * Un libellé qui n'a rien à afficher — le cas courant d'un `label` calculé,
 * comme le motif de blocage d'une action qui n'est pas bloquée.
 */
const isLabelVide = (label: TooltipProps['label']): boolean =>
  label === undefined ||
  label === null ||
  label === false ||
  (typeof label === 'string' && label.trim() === '');

/**
 * Affiche une info bulle.
 *
 * Sans libellé, l'élément est rendu seul : la bulle se réduirait sinon à sa
 * flèche et à ses bordures, un glitch au survol de l'élément.
 */
export const Tooltip = (props: TooltipProps) =>
  isLabelVide(props.label) ? props.children : <TooltipAvecLabel {...props} />;

const TooltipAvecLabel = ({
  children,
  label,
  offsetValue = 10,
  activatedBy = 'hover',
  openingDelay = 500,
  closingDelay = 0,
  placement = 'top',
  withArrow = true,
  className,
}: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // `arrow()` accepte aussi une ref, mais la lire pendant le rendu est
  // justement ce que la règle `react-hooks/refs` interdit : l'élément de la
  // flèche passe donc par un état, mis à jour à son montage.
  const [arrowElement, setArrowElement] = useState<SVGSVGElement | null>(null);

  // Configuration du comportement de la tooltip
  const {
    x,
    y,
    elements,
    strategy,
    context,
    // Déstructuré ici : la règle `react-hooks/refs` prend tout ce qui s'appelle
    // `refs` pour une ref, alors que ce sont deux callbacks de montage.
    refs: { setReference, setFloating },
  } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(offsetValue),
      flip(),
      shift({ padding: 8 }),
      arrow({
        element: arrowElement,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Preserve the consumer's ref
  const ref = useMergedRefs([setReference, children as never]);

  // Hauteur de la bulle. `elements.floating` est un état — contrairement à
  // `refs.floating.current`, qu'il aurait fallu lire pendant le rendu.
  const tooltipHeight = elements.floating?.clientHeight;

  const getStaticOffset = () => {
    if (
      context.placement.endsWith('start') ||
      context.placement.endsWith('end')
    ) {
      if (
        (context.placement.startsWith('right') ||
          context.placement.startsWith('left')) &&
        !!tooltipHeight &&
        tooltipHeight < 40
      ) {
        return '8px';
      }
      return '16px';
    }
    return undefined;
  };

  // Configuration des interactions
  const { getReferenceProps, getFloatingProps } = useInteractions([
    (activatedBy === 'click' ? useClick : useHover)(context, {
      delay: { open: openingDelay, close: closingDelay },
      handleClose: safePolygon(),
    }),
    useFocus(context),
    useRole(context, { role: 'tooltip' }),
    useDismiss(context),
  ]);

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref, ...children.props }))}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={setFloating}
            {...getFloatingProps()}
            style={{
              position: strategy,
              top: y,
              left: x,
              zIndex: preset.theme.extend.zIndex.tooltip,
            }}
            className={classNames(
              'p-2 text-primary-10 border-primary rounded bg-white shadow-lg text-xs [&_*]:text-xs [&_*]:mb-0',
              {
                'border-b': context.placement.startsWith('top'),
                'border-t': context.placement.startsWith('bottom'),
                'border-r': context.placement.startsWith('left'),
                'border-l': context.placement.startsWith('right'),
              },
              className
            )}
          >
            {withArrow && (
              <FloatingArrow
                ref={setArrowElement}
                context={context}
                staticOffset={getStaticOffset()}
                width={8}
                height={4}
                fill={'white'}
                strokeWidth={1}
                stroke={colorTheme.primary.DEFAULT}
              />
            )}
            {typeof label === 'string' ? (
              <p className="w-fit max-w-sm font-normal">{label}</p>
            ) : (
              label
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

// https://github.com/gregberge/react-merge-refs/issues/5#issuecomment-643341631
const useMergedRefs = (refs: Array<unknown>) =>
  useCallback((current: ReferenceType) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(current);
      } else if (ref && !Object.isFrozen(ref)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore:next-line
        ref.current = current;
      }
    });
    // eslint-disable-next-line react-hooks/use-memo
  }, refs);
