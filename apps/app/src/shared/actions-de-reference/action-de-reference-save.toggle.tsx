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
}): JSX.Element => (
  <Button
    size={size}
    icon={isSaved ? 'check-line' : 'bookmark-line'}
    variant={isSaved ? 'primary' : 'outlined'}
    aria-pressed={isSaved}
    disabled={disabled}
    onClick={onToggle}
  >
    {appLabels.actionDeReferenceSauvegarder}
  </Button>
);
