import { appLabels } from '@/app/labels/catalog';
import {
  Children,
  type JSX,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

type Props = PropsWithChildren<{
  leading?: ReactNode;
}>;

export const IndicateurActionsRow = ({
  leading = null,
  children,
}: Props): JSX.Element => {
  const hasLeading = Children.toArray(leading).length > 0;
  const hasTrailing = Children.toArray(children).length > 0;

  return (
    <div
      role="group"
      aria-label={appLabels.indicateurActions}
      className="my-4 flex flex-wrap items-center gap-x-6 gap-y-2"
    >
      {leading}
      {hasLeading && hasTrailing && (
        <span aria-hidden className="h-6 w-px bg-grey-4" />
      )}
      {children}
    </div>
  );
};
