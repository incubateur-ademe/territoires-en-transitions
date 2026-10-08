'use client';

import { useSetIndicateurApplicable } from '@/app/demarches/pcaet/diagnostic/data/use-set-indicateur-applicable';
import { useUpdateDiagnosticIndicateursValeurs } from '@/app/demarches/pcaet/diagnostic/data/use-update-diagnostic-indicateurs-valeurs';
import { useTable } from '@tanstack/react-table';
import { JSX, useMemo } from 'react';
import { IndicateurValeursTableBody } from './indicateur-valeurs.table-body';
import { IndicateurValeursTableHead } from './indicateur-valeurs.table-head';
import { IndicateurValeursTableLegend } from './indicateur-valeurs.table-legend';
import { IndicateurValeursTableFrame } from './indicateur-valeurs.table-frame';
import {
  GridMaxHeight,
  IndicateurTableRow,
  UNSET_REFERENCE_YEAR,
} from './types';
import { useListIndicateurValeursTableColumns } from './use-list-indicateur-valeurs-table-columns';
import {
  indicateurValeursTableFeatures,
  IndicateurValeursTableMeta,
} from './utils';

type Props = {
  demarcheId: number;
  rows: IndicateurTableRow[];
  years: number[];
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
  referenceYear?: number | null;
  onReferenceYearChange: (year: number) => void;
  showRequirementHint?: boolean;
  isRequired: boolean;
};

export const IndicateurValeursTable = ({
  demarcheId,
  rows,
  years,
  title,
  unit,
  isReadonly = false,
  maxHeight = 'compact',
  referenceYear,
  onReferenceYearChange,
  isRequired,
}: Props): JSX.Element => {
  const displayYears = useMemo(() => {
    if (referenceYear === null) {
      return [
        UNSET_REFERENCE_YEAR,
        ...years.filter((year) => year !== UNSET_REFERENCE_YEAR),
      ];
    }
    if (referenceYear !== undefined) {
      return [referenceYear, ...years.filter((year) => year !== referenceYear)];
    }
    return years;
  }, [years, referenceYear]);

  const { updateIndicateurValeurs: mutateIndicateurValeurs } =
    useUpdateDiagnosticIndicateursValeurs(demarcheId);

  const updateIndicateurValeurs: IndicateurValeursTableMeta['updateIndicateurValeurs'] =
    async ({ indicateurId, year, field, value }) => {
      try {
        await mutateIndicateurValeurs({
          valeurs: [{ indicateurId, year, field, value }],
        });
        return true;
      } catch {
        return false;
      }
    };

  const { setIndicateurApplicable: mutateIndicateurApplicable } =
    useSetIndicateurApplicable(demarcheId);

  const setIndicateurApplicable: IndicateurValeursTableMeta['setIndicateurApplicable'] =
    async ({ indicateurId, isApplicable }) => {
      try {
        await mutateIndicateurApplicable({ indicateurId, isApplicable });
        return true;
      } catch {
        return false;
      }
    };

  const { columns } = useListIndicateurValeursTableColumns({
    years: displayYears,
    title,
    unit,
    isReadonly,
    referenceYear,
  });

  const table = useTable({
    features: indicateurValeursTableFeatures,
    data: rows,
    columns,
    meta: {
      onReferenceYearChange,
      updateIndicateurValeurs,
      setIndicateurApplicable,
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <IndicateurValeursTableLegend
        isRequiredValeurLegendVisible={isRequired}
      />
      <IndicateurValeursTableFrame maxHeight={maxHeight}>
        <IndicateurValeursTableHead table={table} />
        <IndicateurValeursTableBody rows={table.getRowModel().rows} />
      </IndicateurValeursTableFrame>
    </div>
  );
};
