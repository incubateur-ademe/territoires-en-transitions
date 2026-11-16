'use client';

import { Icon } from '@tet/ui';

/** Le chevron qui déplie ou replie les sous-lignes d'une ligne. */
export const BasculerGroupeButton = ({
  deplie,
  onClick,
  ariaLabel,
  dataTest,
}: {
  deplie: boolean;
  onClick: () => void;
  ariaLabel: string;
  dataTest: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={deplie}
    aria-label={ariaLabel}
    className="shrink-0 text-primary-9 hover:text-primary-7"
    data-test={dataTest}
  >
    <Icon icon={deplie ? 'arrow-down-s-line' : 'arrow-right-s-line'} />
  </button>
);
