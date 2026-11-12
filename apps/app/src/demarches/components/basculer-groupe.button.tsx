'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Icon } from '@tet/ui';

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

/** Replie toutes les sous-lignes du tableau, ou les déplie toutes. */
export const BasculerTousLesGroupesButton = ({
  toutDeplie,
  onClick,
  dataTest,
}: {
  toutDeplie: boolean;
  onClick: () => void;
  dataTest: string;
}) => (
  <div className="flex justify-end mb-2">
    <Button
      size="xs"
      variant="grey"
      icon={toutDeplie ? 'contract-up-down-line' : 'expand-up-down-line'}
      onClick={onClick}
      dataTest={dataTest}
    >
      {toutDeplie
        ? appLabels.instructionListeToutReplier
        : appLabels.instructionListeToutDeplier}
    </Button>
  </div>
);
