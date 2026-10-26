'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, ButtonMenu, cn } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { useState } from 'react';
import { IndicateurValeurSlot } from './indicateur-valeur.slot';
import type { IndicateurValeurField } from './types';
import { useCellEdit } from './use-cell-edit';

export const IndicateurValeursCombinedCell = ({
  periodeLabel,
  resultat,
  objectif,
  readonly,
  isFuture,
  emptyLabel = appLabels.indicateurValeurAbsente,
  onSave,
}: {
  periodeLabel: string;
  resultat: number | null;
  objectif: number | null;
  readonly?: boolean;
  isFuture: boolean;
  emptyLabel?: string;
  onSave: (
    type: IndicateurValeurField,
    value: number | null
  ) => Promise<boolean>;
}) => {
  const resultatEdit = useCellEdit({
    currentValue: resultat,
    onSave: (value) => onSave('resultat', value),
  });
  const objectifEdit = useCellEdit({
    currentValue: objectif,
    onSave: (value) => onSave('objectif', value),
  });
  const [editingFields, setEditingFields] = useState<
    Record<IndicateurValeurField, boolean>
  >({ resultat: false, objectif: false });
  const setEditing = (type: IndicateurValeurField, isEditing: boolean) => {
    setEditingFields((fields) => ({ ...fields, [type]: isEditing }));
  };
  const isEditing = editingFields.resultat || editingFields.objectif;
  const empty = resultat === null && objectif === null;
  if (empty && readonly)
    return <div className="text-center text-sm text-grey-7">{emptyLabel}</div>;
  const showAddButton = empty && !isEditing;
  const addButton = showAddButton ? (
    <div className="absolute inset-0 flex items-center justify-center gap-1">
      {isFuture ? (
        <Button
          className="whitespace-nowrap"
          size="xs"
          variant="white"
          title={appLabels.indicateurChampValeur(
            appLabels.indicateurAjouterObjectif,
            periodeLabel
          )}
          aria-label={appLabels.indicateurChampValeur(
            appLabels.indicateurAjouterObjectif,
            periodeLabel
          )}
          data-test="indicateurs.valeurs.objectif.add"
          onClick={() => setEditing('objectif', true)}
        >
          {appLabels.indicateurAjouterObjectif}
        </Button>
      ) : (
        <ButtonMenu
          className="whitespace-nowrap"
          size="xs"
          variant="white"
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
                onClick: () => setEditing('resultat', true),
              },
              {
                label: capitalize(appLabels.indicateurObjectif()),
                onClick: () => setEditing('objectif', true),
              },
            ],
          }}
        >
          {appLabels.indicateurAjouterDonnee}
        </ButtonMenu>
      )}
    </div>
  ) : null;
  const visibleTypes = (['resultat', 'objectif'] as const).filter((type) => {
    const value = type === 'resultat' ? resultat : objectif;
    const isReadonly = readonly || (isFuture && type === 'resultat');
    return !(isReadonly && value === null);
  });
  return (
    <div className="relative">
      {addButton}
      {/* Reserve the slots' dimensions even when only the add button is shown. */}
      <div
        data-test="indicateurs.valeurs.slots"
        className={cn(
          'grid min-w-max grid-cols-2 items-center divide-x divide-grey-3',
          showAddButton && 'invisible'
        )}
      >
        {visibleTypes.map((type) => {
          const value = type === 'resultat' ? resultat : objectif;
          const isReadonly = readonly || (isFuture && type === 'resultat');
          return (
            <div
              key={type}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1 px-1',
                // Reserve the same half for each type, even with unequal values.
                visibleTypes.length === 1
                  ? 'col-span-2'
                  : type === 'objectif' && 'col-start-2'
              )}
            >
              <IndicateurValeurSlot
                type={type}
                periodeLabel={periodeLabel}
                value={value}
                readonly={isReadonly}
                isEditing={editingFields[type]}
                onEditingChange={(isEditing) => setEditing(type, isEditing)}
                edit={type === 'resultat' ? resultatEdit : objectifEdit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
