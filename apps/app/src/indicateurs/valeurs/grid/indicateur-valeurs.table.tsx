'use client';

import { useAutosaveStatus } from '@/app/utils/react-query/autosave-status/use-autosave-status';
import { useTable } from '@tanstack/react-table';
import { AutosaveBadge } from '@tet/ui';
import { JSX } from 'react';
import { IndicateurValeursTableBody } from './indicateur-valeurs.table-body';
import { IndicateurValeursTableHead } from './indicateur-valeurs.table-head';
import { IndicateurValeursTableLegend } from './indicateur-valeurs.table-legend';
import { IndicateurValeursTableFrame } from './indicateur-valeurs.table-frame';
import {
  GridMaxHeight,
  IndicateurTableRow,
  IndicateurPeriodeColumn,
} from './types';
import { useListIndicateurValeursTableColumns } from './use-list-indicateur-valeurs-table-columns';
import {
  indicateurValeursTableFeatures,
  IndicateurValeursTableMeta,
} from './utils';

type Props = {
  /** Regroupe les écritures de la grille sous un même badge d'enregistrement. */
  autosaveKey: string;
  rows: IndicateurTableRow[];
  periodeColumns: readonly IndicateurPeriodeColumn[];
  /** Nom de l’indicateur principal affiché en haut à gauche de la grille. */
  title: string;
  unit: string;
  isLoading?: boolean;
  /** Grille consultable : cellules en champs désactivés, collage inerte. */
  isReadonly?: boolean;
  /**
   * Plafond de hauteur, et donc zone de défilement interne dans laquelle
   * l'en-tête et les lignes de secteur restent collantes.
   */
  maxHeight?: GridMaxHeight;
  showRequirementHint?: boolean;
  isRequired: boolean;
} & IndicateurValeursTableMeta;

export const IndicateurValeursTable = ({
  autosaveKey,
  rows,
  periodeColumns,
  title,
  unit,
  isReadonly = false,
  maxHeight = 'compact',
  updateIndicateurValeurs,
  setIndicateurApplicable,
  isRequired,
}: Props): JSX.Element => {
  const { columns } = useListIndicateurValeursTableColumns({
    periodeColumns,
    title,
    unit,
    isReadonly,
  });

  const table = useTable({
    features: indicateurValeursTableFeatures,
    data: rows,
    columns,
    meta: {
      updateIndicateurValeurs,
      setIndicateurApplicable,
    },
  });

  const autosaveStatus = useAutosaveStatus(autosaveKey);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <IndicateurValeursTableLegend
          isRequiredValeurLegendVisible={isRequired}
        />
        {!isReadonly && (
          <AutosaveBadge
            status={autosaveStatus}
            dataTest="indicateurs.valeurs.grille.autosave"
          />
        )}
      </div>
      <IndicateurValeursTableFrame maxHeight={maxHeight}>
        <IndicateurValeursTableHead table={table} />
        <IndicateurValeursTableBody rows={table.getRowModel().rows} />
      </IndicateurValeursTableFrame>
    </div>
  );
};
