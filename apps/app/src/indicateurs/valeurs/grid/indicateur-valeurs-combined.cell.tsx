'use client';

import { appLabels } from '@/app/labels/catalog';
import { ButtonMenu } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { Fragment, useState, type ReactNode } from 'react';
import { IndicateurValeurSlot } from './indicateur-valeur.slot';
import type { IndicateurValeurField } from './types';

export const IndicateurValeursCombinedCell = ({
  periodeLabel,
  resultat,
  objectif,
  actions,
  readonly,
  onSave,
}: {
  periodeLabel: string;
  resultat: number | null;
  objectif: number | null;
  actions?: Partial<Record<IndicateurValeurField, ReactNode>>;
  readonly?: boolean;
  onSave: (
    type: IndicateurValeurField,
    value: number | null
  ) => Promise<boolean>;
}) => {
  const [initialField, setInitialField] =
    useState<IndicateurValeurField | null>(null);
  const empty = resultat === null && objectif === null;
  const trailingActions = (['resultat', 'objectif'] as const)
    .map((type) => {
      const action = actions?.[type];
      return action ? { type, action } : null;
    })
    .filter((entry) => entry !== null);
  if (empty && readonly)
    return trailingActions.length > 0 ? (
      <div className="flex items-center justify-center gap-1">
        <span className="sr-only">{appLabels.indicateurValeurAbsente}</span>
        {trailingActions.map(({ type, action }) => (
          <Fragment key={type}>{action}</Fragment>
        ))}
      </div>
    ) : (
      <span className="sr-only">{appLabels.indicateurValeurAbsente}</span>
    );
  if (empty && !initialField)
    return (
      <div className="flex items-center justify-center gap-1">
        <ButtonMenu
          className="whitespace-nowrap"
          size="xs"
          variant="white"
          icon="add-line"
          withArrow
          title={appLabels.indicateurChampValeur(
            appLabels.indicateurAjouterDonnee,
            periodeLabel
          )}
          data-test="indicateurs.valeurs.add"
          menu={{
            actions: [
              {
                label: capitalize(appLabels.indicateurResultat()),
                onClick: () => setInitialField('resultat'),
              },
              {
                label: capitalize(appLabels.indicateurObjectif()),
                onClick: () => setInitialField('objectif'),
              },
            ],
          }}
        >
          {appLabels.indicateurAjouterDonnee}
        </ButtonMenu>
        {trailingActions.map(({ type, action }) => (
          <Fragment key={type}>{action}</Fragment>
        ))}
      </div>
    );
  return (
    <div className="flex items-center justify-center divide-x divide-grey-3">
      {(['resultat', 'objectif'] as const).map((type) => (
        <div key={type} className="flex items-center gap-1 px-1">
          <IndicateurValeurSlot
            type={type}
            periodeLabel={periodeLabel}
            value={type === 'resultat' ? resultat : objectif}
            readonly={readonly}
            initiallyEditing={initialField === type}
            onSave={(value) => onSave(type, value)}
            onClose={() => setInitialField(null)}
          />
          {actions?.[type]}
        </div>
      ))}
    </div>
  );
};
