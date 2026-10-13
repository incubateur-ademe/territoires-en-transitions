import { IndicateurPeriodiciteBadge } from '@/app/indicateurs/valeurs/indicateur-periodicite.badge';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useState } from 'react';
import { prepareIndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import {
  prepareData,
  type PreparedData,
  type PreparedValue,
} from '../data/prepare-data';
import type { SourceType } from '../types';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';
import { IndicateurValeursTable } from './indicateur-valeurs-table';

const SaisiePeriodique = ({
  periodicite,
  readonly = false,
}: {
  periodicite: 'annuelle';
  readonly?: boolean;
}) => {
  const [periods, setPeriods] = useState<IndicateurPeriode[]>(() => {
    const first = IndicateurPeriodes.containing(periodicite, '2026-01-01');
    return [first, IndicateurPeriodes.next(first)];
  });
  const [values, setValues] = useState<
    Record<string, { resultat: number | null; objectif: number | null }>
  >(() => ({
    [IndicateurPeriodes.key(periods[0])]: { resultat: 0, objectif: 20 },
    [IndicateurPeriodes.key(periods[1])]: { resultat: 12.5, objectif: null },
  }));
  const prepare = (type: SourceType): PreparedData => {
    const base = prepareData(undefined, type, true);
    const source = {
      ...base.sources[0],
      valeurs: periods.map((periode, index) => ({
        id: index + 1,
        calculAuto: false,
        periode,
        periodeLabel: IndicateurPeriodes.format(periode),
        dateValeurISO: `${IndicateurPeriodes.toDateValeur(
          periode
        )}T00:00:00.000Z`,
        valeur: values[IndicateurPeriodes.key(periode)]?.[type] ?? null,
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
  const add = async (newPeriods: IndicateurPeriode[]) => {
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
        resultats={prepareIndicateurPeriodeData(prepare('resultat'))}
        objectifs={prepareIndicateurPeriodeData(prepare('objectif'))}
        readonly={readonly}
        getColorBySourceId={() => '#6a6af4'}
        addPeriode={
          !readonly && (
            <AddIndicateurPeriodeHeader
              periodicite={periodicite}
              existingPeriodes={periods}
              onAdd={(periode) => add([periode])}
            />
          )
        }
        onSave={async (period, type, value) => {
          const key = IndicateurPeriodes.key(period);
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
                IndicateurPeriodes.key(candidate) !==
                IndicateurPeriodes.key(period)
            )
          )
        }
        onComment={() => undefined}
      />
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
export const LectureSeule: Story = {
  args: { periodicite: 'annuelle', readonly: true },
};
