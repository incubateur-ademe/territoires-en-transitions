import { IndicateurPeriodiciteBadge } from '@/app/indicateurs/valeurs/indicateur-periodicite.badge';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  formatIndicateurPeriod,
  IndicateurPeriods,
  type IndicateurPeriodicite,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import { useState } from 'react';
import {
  prepareData,
  type PreparedData,
  type PreparedValue,
} from '../data/prepare-data';
import type { SourceType } from '../types';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';
import { AddIndicateurPeriodesModal } from './add-indicateur-periodes.modal';
import { IndicateurValeursTable } from './indicateur-valeurs-table';

const SaisiePeriodique = ({
  periodicite,
  readonly = false,
}: {
  periodicite: IndicateurPeriodicite;
  readonly?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [periods, setPeriods] = useState<IndicateurPeriod[]>(() => {
    const first = IndicateurPeriods.containing(periodicite, '2026-01-01');
    return [first, IndicateurPeriods.next(first)];
  });
  const [values, setValues] = useState<
    Record<string, { resultat: number | null; objectif: number | null }>
  >(() => ({
    [IndicateurPeriods.key(periods[0])]: { resultat: 0, objectif: 20 },
    [IndicateurPeriods.key(periods[1])]: { resultat: 12.5, objectif: null },
  }));
  const prepare = (type: SourceType): PreparedData => {
    const base = prepareData(undefined, type, true);
    const source = {
      ...base.sources[0],
      valeurs: periods.map((periode, index) => ({
        id: index + 1,
        calculAuto: false,
        periode,
        periodeLabel: formatIndicateurPeriod(periode),
        dateValeurISO: `${IndicateurPeriods.toDateValeur(
          periode
        )}T00:00:00.000Z`,
        valeur: values[IndicateurPeriods.key(periode)]?.[type] ?? null,
        commentaire: null,
      })),
    };
    return {
      ...base,
      sources: [source],
      donneesCollectivite: source,
      periodes: periods,
      valeursExistantes: periods.map((periode, index) => ({
        id: index + 1,
        periode,
      })) as PreparedValue[],
    };
  };
  const add = async (newPeriods: IndicateurPeriod[]) => {
    setPeriods((previous) => [...previous, ...newPeriods]);
    return true;
  };
  return (
    <div className="flex flex-col gap-6 p-8 bg-white">
      <div className="flex items-center gap-4 text-sm">
        <span>Modifié le 08/10/2026</span>
        <IndicateurPeriodiciteBadge
          periodicite={periodicite}
          participationScore={periodicite === 'annuelle'}
        />
      </div>
      <IndicateurValeursTable
        definition={{
          titre: 'Part électrique du parc de véhicules',
          unite: '%',
          periodicite,
        }}
        resultats={prepare('resultat')}
        objectifs={prepare('objectif')}
        readonly={readonly}
        getColorBySourceId={() => '#6a6af4'}
        addPeriod={
          !readonly && (
            <AddIndicateurPeriodeHeader
              periodicite={periodicite}
              existingPeriods={periods}
              onAdd={add}
              onOpenModal={() => setIsOpen(true)}
            />
          )
        }
        onSave={async (period, type, value) => {
          const key = IndicateurPeriods.key(period);
          setValues((previous) => ({
            ...previous,
            [key]: {
              ...(previous[key] ?? { resultat: null, objectif: null }),
              [type]: value,
            },
          }));
          return true;
        }}
        onDelete={(period) =>
          setPeriods((previous) =>
            previous.filter(
              (candidate) =>
                IndicateurPeriods.key(candidate) !==
                IndicateurPeriods.key(period)
            )
          )
        }
        onComment={() => undefined}
      />
      {isOpen && (
        <AddIndicateurPeriodesModal
          periodicite={periodicite}
          existingPeriods={periods}
          onAdd={add}
          openState={{ isOpen, setIsOpen }}
        />
      )}
    </div>
  );
};

const meta = {
  title: 'Indicateurs/Saisie périodique',
  component: SaisiePeriodique,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SaisiePeriodique>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Annuelle: Story = { args: { periodicite: 'annuelle' } };
export const Mensuelle: Story = { args: { periodicite: 'mensuelle' } };
export const Trimestrielle: Story = { args: { periodicite: 'trimestrielle' } };
export const Semestrielle: Story = { args: { periodicite: 'semestrielle' } };
export const LectureSeule: Story = {
  args: { periodicite: 'mensuelle', readonly: true },
};
