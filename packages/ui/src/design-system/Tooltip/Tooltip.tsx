import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  Placement,
  ReferenceType,
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
import { cloneElement, JSX, useCallback, useRef, useState } from 'react';
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

/** Affiche une info bulle */

export const Tooltip = ({
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

  const arrowRef = useRef(null);

  // Configuration du comportement de la tooltip
  const { x, y, refs, strategy, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(offsetValue),
      flip(),
      shift({ padding: 8 }),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Preserve the consumer's ref
  const ref = useMergedRefs([refs.setReference, children as never]);

  // Tooltip height
  const tooltipHeight = refs.floating.current?.clientHeight;

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
            ref={refs.setFloating}
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
                ref={arrowRef}
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
