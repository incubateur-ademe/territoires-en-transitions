import {cloneElement, useCallback, useState} from 'react';
import {
  Placement,
  offset,
  flip,
  shift,
  autoUpdate,
  useFloating,
  useInteractions,
  useHover,
  useFocus,
  useRole,
  useDismiss,
  useClick,
} from '@floating-ui/react-dom-interactions';

export type TTooltipProps = {
  /** libellé de l'infobulle (accepte du code HTML) */
  label: string;
  /** position à utiliser de préférence */
  placement?: Placement;
  /** élément auquel ajouter l'infobulle */
  children: JSX.Element;
  /** événement déclenchant l'affichage de l'info-bulle */
  activatedBy?: 'hover' | 'click';
};

// les styles de l'infobulle
// TODO: permettre de les surcharger si nécessaire
const tooltipClass =
  'pointer-events-none max-w-prose px-2 py-1 bg-[#19271D] text-white text-xs z-10';

/**
 * Affiche une info-bulle
 *
 * Copié/adapté depuis https://floating-ui.com/docs/react-dom-interactions#tooltip
 */
export const Tooltip = ({
  children,
  label,
  placement = 'bottom-start',
  activatedBy = 'hover',
}: TTooltipProps) => {
  const [open, setOpen] = useState(false);

  const {x, y, reference, floating, strategy, context} = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [offset(5), flip(), shift({padding: 8})],
    whileElementsMounted: autoUpdate,
  });

  const {getReferenceProps, getFloatingProps} = useInteractions([
    (activatedBy === 'click' ? useClick : useHover)(context),
    useFocus(context),
    useRole(context, {role: 'tooltip'}),
    useDismiss(context),
  ]);

  // Preserve the consumer's ref
  const ref = useMergedRefs([reference, children as never]);

  return (
    <>
      {cloneElement(children, getReferenceProps({ref, ...children.props}))}
      {open && (
        <div
          ref={floating}
          className={tooltipClass}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          {...getFloatingProps()}
          dangerouslySetInnerHTML={{__html: label}}
        ></div>
      )}
    </>
  );
};

// https://github.com/gregberge/react-merge-refs/issues/5#issuecomment-643341631
const useMergedRefs = (refs: Array<unknown>) =>
  useCallback(current => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(current);
      } else if (ref && !Object.isFrozen(ref)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore:next-line
        ref.current = current;
      }
    });
  }, refs);
