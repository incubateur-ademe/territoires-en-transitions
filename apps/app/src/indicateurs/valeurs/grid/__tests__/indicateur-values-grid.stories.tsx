import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@tet/ui';
import { fn } from 'storybook/test';
import { JSX, useState } from 'react';
import { buildDiagnosticIndicateurPeriodColumns } from '../../../../demarches/pcaet/diagnostic/indicateurs-grid/diagnostic-indicateur-period.columns';
import { IndicateurValeursTable } from '../indicateur-valeurs.table';
import { IndicateurTableRow } from '../types';
import {
  fakeReferenceYear,
  fakeRow,
  fakeRows,
  fakeYears,
} from './grid-fixtures';

const periodColumns = buildDiagnosticIndicateurPeriodColumns({
  years: fakeYears,
  referenceYear: fakeReferenceYear,
  currentYear: fakeReferenceYear,
  onReferenceYearChange: fn(),
  isReadonly: false,
});
const updateIndicateurValeurs = fn().mockResolvedValue(true);
const setIndicateurApplicable = fn().mockResolvedValue(true);

const meta: Meta<typeof IndicateurValeursTable> = {
  title: 'Indicateurs/Grille de saisie',
  component: IndicateurValeursTable,
  args: {
    autosaveKey: 'grille',
    rows: fakeRows,
    periodColumns,
    updateIndicateurValeurs,
    setIndicateurApplicable,
    title: 'Polluants atmosphériques',
    unit: 't/an',
    isRequired: true,
  },
};

export default meta;

type Story = StoryObj<typeof IndicateurValeursTable>;

export const Polluants: Story = {};

export const LectureSeule: Story = {
  args: {
    isReadonly: true,
    periodColumns: buildDiagnosticIndicateurPeriodColumns({
      years: fakeYears,
      referenceYear: fakeReferenceYear,
      currentYear: fakeReferenceYear,
      isReadonly: true,
    }),
  },
};

export const SansAnneeDeReference: Story = {
  args: {
    periodColumns: buildDiagnosticIndicateurPeriodColumns({
      years: fakeYears.filter((year) => year !== fakeReferenceYear),
      referenceYear: null,
      currentYear: fakeReferenceYear,
      onReferenceYearChange: fn(),
      isReadonly: false,
    }),
  },
};

export const Vide: Story = {
  args: {
    rows: fakeRows.map((row) => ({
      ...row,
      indicateurValeurs: [],
    })),
  },
};

const polluantLabels = ['NOx', 'PM10'] as const;
type PolluantLabel = (typeof polluantLabels)[number];

const secteurLabels = [
  'Résidentiel',
  'Tertiaire',
  'Transport routier',
  'Agriculture',
  'Industrie',
];

const rowsByPolluant: Record<PolluantLabel, IndicateurTableRow[]> = {
  NOx: secteurLabels.map((label, index) =>
    fakeRow({ indicateurId: 100 + index, indicateurLabel: label })
  ),
  PM10: secteurLabels.map((label, index) =>
    fakeRow({ indicateurId: 200 + index, indicateurLabel: label })
  ),
};

const PolluantSwitchGrid = (): JSX.Element => {
  const [selectedPolluant, setSelectedPolluant] =
    useState<PolluantLabel>('NOx');

  return (
    <div className="flex flex-col items-start gap-2">
      <div role="group" aria-label="Choix du polluant" className="flex gap-2">
        {polluantLabels.map((polluant) => {
          const isSelected = polluant === selectedPolluant;
          return (
            <Button
              key={polluant}
              size="xs"
              variant={isSelected ? 'primary' : 'outlined'}
              aria-pressed={isSelected}
              onClick={() => setSelectedPolluant(polluant)}
            >
              {polluant}
            </Button>
          );
        })}
      </div>
      <IndicateurValeursTable
        autosaveKey="grille"
        rows={rowsByPolluant[selectedPolluant]}
        periodColumns={periodColumns}
        updateIndicateurValeurs={updateIndicateurValeurs}
        setIndicateurApplicable={setIndicateurApplicable}
        title="Polluants atmosphériques"
        unit="t/an"
        isRequired
      />
    </div>
  );
};

export const SwitchEntrePolluants: Story = {
  render: () => <PolluantSwitchGrid />,
};
