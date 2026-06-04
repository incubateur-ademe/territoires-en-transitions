'use client';

import { appLabels } from '@/app/labels/catalog';
import { Checkbox, Tab, Tabs } from '@tet/ui';
import { JSX, useState } from 'react';
import { EntryGrid } from './entry-grid';
import { GridActionsBar } from './grid-actions-bar';
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
import { PolluantsToolbar, ViewMode } from './polluants-toolbar';
import { AIR_SECTORS, HORIZON_YEARS } from './polluants-atmospheriques.constants';
import { useGridDraft } from './use-grid-draft';
import { useGridLayout } from './use-grid-layout';

type PolluantsAtmospheriquesViewProps = {
  indicators: IndicatorValues[];
  isSaving: boolean;
  onSave: (cells: DraftCell[]) => Promise<boolean>;
};

export const PolluantsAtmospheriquesView = ({
  indicators,
  isSaving,
  onSave,
}: PolluantsAtmospheriquesViewProps): JSX.Element => {
  const draft = useGridDraft();
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

  const years = [
    referenceYear,
    ...HORIZON_YEARS.filter((year) => year !== referenceYear),
  ];

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
    setPasteErrors(formatPasteErrors(outcome.errors, indexIndicatorLabels(rows)));
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
    if (draft.cells.length === 0) {
      return;
    }
    const saved = await onSave(draft.cells);
    if (saved) {
      draft.reset();
      setPasteErrors([]);
    }
  };

  const handleReset = (): void => {
    draft.reset();
    setPasteErrors([]);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-primary-9">
          {appLabels.demarchePcaetPolluantsTitre}
        </h1>
        <p className="m-0 text-sm text-grey-7">
          {appLabels.demarchePcaetPolluantsDescription}
        </p>
      </div>

      <PolluantsToolbar
        referenceYear={referenceYear}
        onReferenceYearChange={setReferenceYear}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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

      {openDataAvailableCount > 0 && (
        <Checkbox
          variant="switch"
          checked={showOpenData}
          onChange={(event) => setShowOpenData(event.currentTarget.checked)}
          label={appLabels.demarchePcaetPolluantsAfficherOpenData({
            count: openDataAvailableCount,
          })}
        />
      )}

      <EntryGrid
        rows={displayedRows}
        years={years}
        referenceYear={referenceYear}
        showSector={viewMode === 'flat'}
        showOpenData={showOpenData}
        onCellChange={handleCellChange}
        onPaste={handlePaste}
        onMoveSector={layout.moveSector}
        onMovePollutant={layout.movePollutant}
      />

      {pasteErrors.length > 0 && (
        <PasteErrorsAlert
          messages={pasteErrors}
          onDismiss={() => setPasteErrors([])}
        />
      )}

      <GridActionsBar
        pendingCount={draft.pendingCount}
        isSaving={isSaving}
        onReset={handleReset}
        onSave={handleSave}
      />
    </div>
  );
};
