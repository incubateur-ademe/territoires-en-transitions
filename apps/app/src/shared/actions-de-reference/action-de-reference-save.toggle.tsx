import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';

export const ActionDeReferenceSaveToggle = ({
  isSaved,
  size,
  disabled,
  onToggle,
}: {
  readonly isSaved: boolean;
  readonly size: 'xs' | 'sm';
  readonly disabled?: boolean;
  readonly onToggle: () => void;
}): JSX.Element => {
  const label = isSaved
    ? appLabels.actionDeReferenceDejaSauvegardee
    : appLabels.actionDeReferenceSauvegarder;

  return (
    <Button
      size={size}
      icon={isSaved ? 'check-line' : 'bookmark-line'}
      variant={isSaved ? 'primary' : 'outlined'}
      disabled={disabled}
      onClick={onToggle}
    >
      {label}
    </Button>
  );
};
