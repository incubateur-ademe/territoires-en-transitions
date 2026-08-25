'use client';

import { appLabels } from '@/app/labels/catalog';
import { Table } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { CSSProperties, JSX, useRef } from 'react';
import { GridBody } from './grid-body';
import { useGridContext } from './grid-context';
import { GridHead } from './grid-head';
import { GridLegend } from './grid-legend';
import { useGridCopyPaste } from './paste/use-grid-copy-paste';
import { ReferenceYearField } from './reference-year/reference-year-field';
import { GridMaxHeight } from './types';
import { useGetTable } from './use-get-table';
import { useHorizontalScrollEdges } from './use-horizontal-scroll-edges';
import { useTableHeadHeight } from './use-table-head-height';

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

export const GridFrame = (): JSX.Element => {
  const {
    groups,
    isGrouped,
    years,
    referenceYear,
    cells,
    actions,
    notify,
    isReadonly,
    maxHeight,
    onReferenceYearChange,
    onAddYear,
  } = useGridContext();

  const { table, tableRef } = useGetTable({
    groups,
    years,
  });

  const headHeight = useTableHeadHeight(tableRef);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { canScrollLeft, canScrollRight } = useHorizontalScrollEdges(scrollRef);

  const { onPaste } = useGridCopyPaste({
    groups,
    years,
    referenceYear,
    cells,
    saveCellValues: actions.saveCellValues,
    notify,
  });

  return (
    <div className="flex flex-col gap-2">
      {onReferenceYearChange !== undefined && referenceYear !== null ? (
        <ReferenceYearField
          year={referenceYear}
          years={years}
          onReferenceYearChange={onReferenceYearChange}
        />
      ) : null}
      <GridLegend />
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
          onPasteCapture={isReadonly ? undefined : onPaste}
          aria-label={appLabels.indicateurValeursGrille}
          role="grid"
          className="border-separate border-spacing-0"
        >
          <GridHead table={table} />
          <GridBody
            rows={table.getRowModel().rows}
            groups={groups}
            isGrouped={isGrouped}
            showAddYearColumn={onAddYear !== undefined}
          />
        </Table>
      </div>
    </div>
  );
};
