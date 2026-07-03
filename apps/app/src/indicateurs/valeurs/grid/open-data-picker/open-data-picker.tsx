import { appLabels } from '@/app/labels/catalog';
import { Button, cn, Icon } from '@tet/ui';
import { JSX } from 'react';
import { OpenDataSource, Year } from '../types';

const publicationYear = (dateVersion: string): number =>
  new Date(dateVersion).getFullYear();

const PickerHeader = ({
  groupLabel,
  rowLabel,
  year,
  onClose,
}: {
  groupLabel: string;
  rowLabel: string;
  year: Year;
  onClose: () => void;
}): JSX.Element => (
  <header className="flex items-start justify-between gap-2">
    <div className="flex flex-col">
      <p className="mb-0 text-base font-bold text-primary-9">
        {appLabels.indicateurCompleterOpenData}
      </p>
      <p className="text-xs text-grey-6">
        {appLabels.indicateurContexteCellule(groupLabel, rowLabel, year)}
      </p>
    </div>
    <Button
      variant="unstyled"
      icon="close-line"
      onClick={onClose}
      title={appLabels.fermer}
    />
  </header>
);

const SourceValue = ({
  value,
  unit,
  isSelected,
}: {
  value: number;
  unit: string | null;
  isSelected: boolean;
}): JSX.Element => (
  <span className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-success-1">
    {isSelected ? <Icon icon="checkbox-circle-fill" size="sm" /> : null}
    {unit !== null ? `${value} ${unit}` : value}
  </span>
);

const SourceCard = ({
  source,
  year,
  unit,
  isSelected,
  onSelect,
}: {
  source: OpenDataSource;
  year: Year;
  unit: string | null;
  isSelected: boolean;
  onSelect: () => void;
}): JSX.Element => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    className={cn(
      'flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
      isSelected
        ? 'border-success-1 bg-success-1/5'
        : 'border-grey-3 hover:border-primary-4 hover:bg-primary-0'
    )}
  >
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-bold text-primary-9">{source.libelle}</span>
      <span className="text-xs text-grey-6">
        {appLabels.indicateurSourceDonnee(source.libelle, year)}
      </span>
      {source.methodologie !== null ? (
        <span className="text-xs text-grey-6">
          {appLabels.indicateurSourceMethodologie(
            source.methodologie,
            publicationYear(source.dateVersion)
          )}
        </span>
      ) : null}
    </span>
    <SourceValue value={source.value} unit={unit} isSelected={isSelected} />
  </button>
);

const SourceList = ({
  sources,
  year,
  unit,
  selectedSourceId,
  onSelect,
}: {
  sources: OpenDataSource[];
  year: Year;
  unit: string | null;
  selectedSourceId?: string;
  onSelect: (sourceId: string) => void;
}): JSX.Element => (
  <ul
    aria-label={appLabels.indicateurSelectionnerValeurOpenData}
    className="flex flex-col gap-2"
  >
    {sources.map((source) => (
      <li key={source.sourceId}>
        <SourceCard
          source={source}
          year={year}
          unit={unit}
          isSelected={source.sourceId === selectedSourceId}
          onSelect={() => onSelect(source.sourceId)}
        />
      </li>
    ))}
  </ul>
);

const ColumnSelectionButton = ({
  libelle,
  count,
  groupLabel,
  onSelect,
}: {
  libelle: string;
  count: number;
  groupLabel: string;
  onSelect: () => void;
}): JSX.Element => (
  <button
    type="button"
    onClick={onSelect}
    className="rounded-lg border border-dashed border-success-1 bg-success-1/10 p-3 text-left text-sm text-success-1 transition-colors hover:bg-success-1/20"
  >
    {appLabels.indicateurSelectionnerPourColonne(libelle, count, groupLabel)}
  </button>
);

const ManualEntryButton = ({
  onClick,
}: {
  onClick: () => void;
}): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 flex items-center gap-2 rounded-lg border border-grey-3 p-3 text-left text-sm text-grey-8 transition-colors hover:border-primary-4 hover:bg-primary-0"
  >
    <Icon icon="edit-line" size="sm" />
    {appLabels.indicateurRepasserSaisieManuelle}
  </button>
);

export type ColumnSelection = {
  source: OpenDataSource;
  count: number;
  onSelect: () => Promise<boolean>;
};

type OpenDataPickerProps = {
  groupLabel: string;
  rowLabel: string;
  year: Year;
  unit: string | null;
  sources: OpenDataSource[];
  selectedSourceId?: string;
  onSelect: (sourceId: string) => void;
  onClose: () => void;
  onReset: () => void;
  columnSelection?: ColumnSelection;
};

export const OpenDataPicker = ({
  groupLabel,
  rowLabel,
  year,
  unit,
  sources,
  selectedSourceId,
  onSelect,
  onClose,
  onReset,
  columnSelection,
}: OpenDataPickerProps): JSX.Element => {
  const canGoBackToManualMode = selectedSourceId !== undefined;
  return (
    <section
      aria-label={appLabels.indicateurCompleterOpenData}
      className="flex w-80 flex-col p-3"
    >
      <PickerHeader
        groupLabel={groupLabel}
        rowLabel={rowLabel}
        year={year}
        onClose={onClose}
      />
      <SourceList
        sources={sources}
        year={year}
        unit={unit}
        selectedSourceId={selectedSourceId}
        onSelect={onSelect}
      />
      {columnSelection !== undefined ? (
        <ColumnSelectionButton
          libelle={columnSelection.source.libelle}
          count={columnSelection.count}
          groupLabel={groupLabel}
          onSelect={columnSelection.onSelect}
        />
      ) : null}
      {canGoBackToManualMode ? <ManualEntryButton onClick={onReset} /> : null}
    </section>
  );
};
