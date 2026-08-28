'use client';

import { useUpdateDiagnosticIndicateursValeurs } from '@/app/demarches/pcaet/diagnostic/data/use-update-diagnostic-indicateurs-valeurs';
import { appLabels } from '@/app/labels/catalog';
import { getCoreRowModel, RowData, useReactTable } from '@tanstack/react-table';
import { cn, Table } from '@tet/ui';
import { CSSProperties, JSX, useMemo, useRef } from 'react';
import { IndicateurValeursTableBody } from './indicateur-valeurs.table-body';
import { IndicateurValeursTableHead } from './indicateur-valeurs.table-head';
import { IndicateurValeursTableLegend } from './indicateur-valeurs.table-legend';
import {
  GridMaxHeight,
  IndicateurTableRow,
  UNSET_REFERENCE_YEAR,
} from './types';
import { useHorizontalScrollEdges } from './use-horizontal-scroll-edges';
import { useListIndicateurValeursTableColumns } from './use-list-indicateur-valeurs-table-columns';
import { useTableHeadHeight } from './use-table-head-height';
import { IndicateurValeursTableMeta } from './utils';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onReferenceYearChange?: IndicateurValeursTableMeta['onReferenceYearChange'];
    updateIndicateurValeurs?: IndicateurValeursTableMeta['updateIndicateurValeurs'];
  }
}

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

/**
 * `viewport` : tout le chrome au-dessus de la grille (en-tête de page, onglets)
 * défile avec la page, seule la barre d'étapes collante du bas doit rester
 * dégagée.
 */
const MAX_HEIGHT_CLASSNAME: Record<GridMaxHeight, string | undefined> = {
  compact: 'max-h-[70vh]',
  viewport: 'max-h-[calc(100dvh-6rem)]',
  none: undefined,
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

  const { columns } = useListIndicateurValeursTableColumns({
    years: displayYears,
    title,
    unit,
    isReadonly,
    referenceYear,
  });

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onReferenceYearChange,
      updateIndicateurValeurs,
    },
  });

  const tableRef = useRef<HTMLTableElement>(null);

  const headHeight = useTableHeadHeight(tableRef);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight } = useHorizontalScrollEdges(scrollRef);

  return (
    <div className="flex flex-col gap-2">
      <IndicateurValeursTableLegend
        isRequiredValeurLegendVisible={isRequired}
      />
      {/* overflow-auto reste nécessaire pour le défilement horizontal
          (cellules sticky left/right) même sans plafond de hauteur. Le plafond,
          lui, crée la zone de défilement vertical dont l'en-tête collant a
          besoin : sans lui, son `top: 0` n'a rien à quoi se raccrocher.
          `--grid-head-height` descend par héritage jusqu'aux lignes de secteur,
          qui s'y collent.
          `isolate` enferme l'échelle de z-index interne (en-tête `z-40`,
          lignes de secteur `z-20`) dans son propre contexte d'empilement :
          sans lui, elle rivalisait avec le chrome de la page et une ligne de
          secteur collante passait par-dessus la barre d'étapes du bas.
          `group` + `data-can-scroll-*` : les colonnes figées y accrochent leur
          ombre de défilement (cf. `scroll-shadow.ts`). */}
      <div
        ref={scrollRef}
        data-can-scroll-left={canScrollLeft}
        data-can-scroll-right={canScrollRight}
        className={cn(
          'group isolate overflow-auto rounded-xl border border-grey-3',
          MAX_HEIGHT_CLASSNAME[maxHeight ?? 'compact']
        )}
        style={{ '--grid-head-height': `${headHeight}px` } as CSSProperties}
      >
        <Table
          ref={tableRef}
          aria-label={appLabels.indicateurValeursGrille}
          role="grid"
          className="border-separate border-spacing-0"
        >
          <IndicateurValeursTableHead table={table} />
          <IndicateurValeursTableBody rows={table.getRowModel().rows} />
        </Table>
      </div>
    </div>
  );
};
