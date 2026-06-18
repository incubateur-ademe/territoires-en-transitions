'use client';

import { appLabels } from '@/app/labels/catalog';
import { Tab, Tabs } from '@tet/ui';
import { JSX, useMemo, useState } from 'react';
import { EntryGrid } from './entry-grid';
import {
  applyPaste,
  buildGridRows,
  buildTargetGrid,
  countOpenDataProposals,
  DraftCell,
  indexIndicatorLabels,
  indexReferenceValues,
  IndicatorValues,
  SectorLetter,
} from './grid-model';
import { formatPasteErrors } from './paste-error-labels';
import { PasteErrorsAlert } from './paste-errors-alert';
import {
  AIR_SECTORS,
  HORIZON_YEARS,
} from './polluants-atmospheriques.constants';
import { PolluantsToolbar, ViewMode } from './polluants-toolbar';
import { GridDraft, useGridDraft } from './use-grid-draft';
import { useGridLayout } from './use-grid-layout';

export { useGridDraft };
export type { DraftCell, GridDraft };

type PolluantsAtmospheriquesViewProps = {
  indicators: IndicatorValues[];
  isSaving: boolean;
  draft: GridDraft;
  onSave: (cells: DraftCell[]) => Promise<boolean>;
  onReset: () => void;
};

export const PolluantsAtmospheriquesView = ({
  indicators,
  isSaving,
  draft,
  onSave,
  onReset,
}: PolluantsAtmospheriquesViewProps): JSX.Element => {
  const layout = useGridLayout();
  const [pasteErrors, setPasteErrors] = useState<string[]>([]);
  const [referenceYear, setReferenceYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [activeSectorLetter, setActiveSectorLetter] = useState<SectorLetter>(
    AIR_SECTORS[0].letter
  );
  const [showOpenData, setShowOpenData] = useState(false);

  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () => [
      referenceYear,
      ...[currentYear, ...HORIZON_YEARS].filter(
        (y, i, a) => y !== referenceYear && a.indexOf(y) === i
      ),
    ],
    [referenceYear, currentYear]
  );

  const rows = buildGridRows({
    indicators,
    orderedSectors: layout.orderedSectors,
    orderedPollutants: layout.orderedPollutants,
    years,
    referenceYear,
    draft: draft.byKey,
  });

  const activeSectorIndex = Math.max(
    0,
    layout.orderedSectors.findIndex(
      (sector) => sector.letter === activeSectorLetter
    )
  );

  const displayedRows =
    viewMode === 'flat'
      ? rows
      : rows.filter((row) => row.sectorIndex === activeSectorIndex);

  const targetGrid = buildTargetGrid(displayedRows);
  const openDataAvailableCount = countOpenDataProposals(displayedRows);

  const handlePaste = ({
    paste,
    anchor,
  }: {
    paste: string;
    anchor: { row: number; column: number };
  }): void => {
    const outcome = applyPaste({
      paste,
      targetGrid,
      anchor,
      referenceYear,
      baseReferences: indexReferenceValues(rows, referenceYear),
    });
    draft.applyCells(outcome.cells);
    setPasteErrors(
      formatPasteErrors(outcome.errors, indexIndicatorLabels(rows))
    );
  };

  const handleCellChange = ({
    indicateurId,
    year,
    value,
  }: {
    indicateurId: number;
    year: number;
    value: number | null;
  }): void => {
    draft.setCell({ indicateurId, year, field: 'resultat', value });
  };

  const handleSave = async (): Promise<void> => {
    if (draft.cells.length === 0) return;
    const saved = await onSave(draft.cells);
    if (saved) {
      onReset();
      setPasteErrors([]);
    }
  };

  const handleReset = (): void => {
    onReset();
    setPasteErrors([]);
  };

  const availableYears = useMemo(
    () =>
      [currentYear, ...HORIZON_YEARS]
        .filter((y, i, a) => a.indexOf(y) === i)
        .sort((a, b) => a - b),
    [currentYear]
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-primary-9 m-0">
        {appLabels.demarchePcaetPolluantsDescription}
      </p>

      <div className="p-4 pt-3 lg:p-8 lg:pt-6 bg-white rounded-xl border border-grey-3">
        <div className="flex flex-col gap-4">
          <PolluantsToolbar
            availableYears={availableYears}
            referenceYear={referenceYear}
            onReferenceYearChange={setReferenceYear}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            openDataAvailableCount={openDataAvailableCount}
            showOpenData={showOpenData}
            onShowOpenDataChange={setShowOpenData}
          />

          {viewMode === 'tabs' && (
            <Tabs
              size="sm"
              layoutOnOverflow="wrap"
              defaultActiveTab={activeSectorIndex}
              onChange={(index) => {
                const sector = layout.orderedSectors[index];
                if (sector) {
                  setActiveSectorLetter(sector.letter);
                }
              }}
            >
              {layout.orderedSectors.map((sector) => (
                <Tab key={sector.letter} label={sector.label} />
              ))}
            </Tabs>
          )}

          <EntryGrid
            rows={displayedRows}
            years={years}
            referenceYear={referenceYear}
            showSector={viewMode === 'flat'}
            showOpenData={showOpenData}
            onCellChange={handleCellChange}
            onPaste={handlePaste}
          />

          {pasteErrors.length > 0 && (
            <PasteErrorsAlert
              messages={pasteErrors}
              onDismiss={() => setPasteErrors([])}
            />
          )}
        </div>
      </div>
    </div>
  );
};
