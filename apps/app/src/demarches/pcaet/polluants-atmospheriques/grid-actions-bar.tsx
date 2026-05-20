'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { JSX } from 'react';

export const GridActionsBar = ({
  pendingCount,
  isSaving,
  onReset,
  onSave,
}: {
  pendingCount: number;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}): JSX.Element => (
  <div className="flex items-center justify-end gap-3">
    {pendingCount > 0 && (
      <span className="text-sm text-grey-7">
        {appLabels.demarchePcaetPolluantsValeursEnAttente({
          count: pendingCount,
        })}
      </span>
    )}
    <Button
      variant="outlined"
      onClick={onReset}
      disabled={pendingCount === 0 || isSaving}
    >
      {appLabels.demarchePcaetPolluantsAnnulerModifications}
    </Button>
    <Button
      onClick={onSave}
      disabled={pendingCount === 0 || isSaving}
      loading={isSaving}
    >
      {appLabels.valider}
    </Button>
  </div>
);
