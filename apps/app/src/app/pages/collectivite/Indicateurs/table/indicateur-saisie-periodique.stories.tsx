import { IndicateurPeriodiciteBadge } from '@/app/indicateurs/valeurs/indicateur-periodicite.badge';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IndicateurPeriodes,
  type IndicateurPeriodicite,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import { Button } from '@tet/ui';
import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { prepareIndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
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
  empty = false,
  initialResultat = 12.5,
}: {
  periodicite: IndicateurPeriodicite;
  readonly?: boolean;
  empty?: boolean;
  initialResultat?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [periods, setPeriods] = useState<IndicateurPeriode[]>(() => {
    if (empty) return [];
    const first = IndicateurPeriodes.containing(periodicite, '2026-01-01');
    return [first, IndicateurPeriodes.next(first)];
  });
  const [values, setValues] = useState<
    Record<string, { resultat: number | null; objectif: number | null }>
  >(() =>
    empty
      ? {}
      : {
          [IndicateurPeriodes.key(periods[0])]: { resultat: 0, objectif: 20 },
          [IndicateurPeriodes.key(periods[1])]: {
            resultat: initialResultat,
            objectif: null,
          },
        }
  );
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
          !readonly &&
          (periodicite === 'annuelle' ? (
            <AddIndicateurPeriodeHeader
              periodicite={periodicite}
              existingPeriodes={periods}
              onAdd={(periode) => add([periode])}
            />
          ) : (
            <Button size="sm" onClick={() => setIsOpen(true)}>
              {getIndicateurPeriodPresentation(periodicite).editor.addLabel}
            </Button>
          ))
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
      {isOpen && periodicite !== 'annuelle' && (
        <AddIndicateurPeriodesModal
          periodicite={periodicite}
          existingPeriodes={periods}
          onAdd={async (periodes) => {
            await add(periodes);
          }}
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
export const Vide: Story = {
  args: { periodicite: 'mensuelle', empty: true },
};
export const VideLectureSeule: Story = {
  args: { periodicite: 'mensuelle', empty: true, readonly: true },
};

export const SaisieValeurCourte: Story = {
  args: { periodicite: 'mensuelle', initialResultat: 1234 },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Résultat — février 2026' })
    );
    await expect(
      canvas.getByRole('textbox', { name: 'Résultat — février 2026' })
    ).toHaveValue('1234');
  },
};

export const SaisieValeurLongue: Story = {
  args: { periodicite: 'mensuelle', initialResultat: -12345678.125 },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Résultat — février 2026' })
    );
    await expect(
      canvas.getByRole('textbox', { name: 'Résultat — février 2026' })
    ).toHaveValue('-12345678.125');
  },
};

export const AjoutMoisDepuisTableauVide: Story = {
  args: { periodicite: 'mensuelle', empty: true },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(canvas.getAllByRole('row')).toHaveLength(2);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Ajouter un mois' })
    );
    const dialog = page.getByRole('dialog', { name: 'Ajouter un mois' });
    const modal = within(dialog);
    await userEvent.click(modal.getByRole('button', { name: 'Mois' }));

    const decembre = page.getByRole('button', {
      name: 'Décembre',
    });
    decembre.scrollIntoView({ block: 'nearest' });
    await userEvent.click(decembre);
    await expect(dialog).toBeVisible();
    await userEvent.type(modal.getByRole('textbox', { name: 'Année' }), '2026');
    await userEvent.click(modal.getByRole('button', { name: 'Ajouter' }));
    await expect(
      canvas.getByRole('columnheader', { name: /décembre 2026/ })
    ).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(3);
  },
};
