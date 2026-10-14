import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useState } from 'react';
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from 'storybook/test';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';
import { IndicateurValeursTable } from './indicateur-valeurs-table';

const initialYears = [2014, 2016, 2018, 2020, 2022, 2024, 2026];

const buildData = (
  periodes: IndicateurPeriode[],
  type: 'resultat' | 'objectif'
): IndicateurPeriodeData => {
  const source = {
    source: 'collectivite',
    libelle: 'Ma collectivité',
    ordreAffichage: 0,
    metadonnees: [],
    calculAuto: false,
    type,
    valeurs: periodes.map((periode) => ({
      id: undefined,
      periode,
      periodeLabel: IndicateurPeriodes.format(periode),
      dateValeurISO: `${periode.dateDebut}T00:00:00.000Z`,
      calculAuto: false,
      valeur: initialYears.includes(
        Number(IndicateurPeriodes.serialize(periode))
      )
        ? type === 'resultat'
          ? 12345678
          : 1
        : null,
      commentaire: null,
    })),
  };
  return {
    indicateurId: 1,
    periodes,
    periodeModePrive: undefined,
    sources: [source],
    donneesCollectivite: source,
    valeursExistantes: [],
  };
};

const NavigationTable = () => {
  const [periodes, setPeriodes] = useState<IndicateurPeriode[]>(() =>
    initialYears.map(IndicateurPeriodes.fromYear)
  );
  const [periodeToReveal, setPeriodeToReveal] = useState<IndicateurPeriode>();
  return (
    <div className="w-full max-w-[900px]">
      <IndicateurValeursTable
        definition={{ titre: 'Consommation énergétique', unite: 'MWh' }}
        resultats={buildData(periodes, 'resultat')}
        objectifs={buildData(periodes, 'objectif')}
        periodeToReveal={periodeToReveal}
        addPeriode={
          <AddIndicateurPeriodeHeader
            periodicite="annuelle"
            existingPeriodes={periodes}
            onAdd={async (periode) => {
              setPeriodes((current) =>
                IndicateurPeriodes.merge(current, [periode])
              );
              setPeriodeToReveal(periode);
              return true;
            }}
          />
        }
        getColorBySourceId={() => 'blue'}
        onSave={fn().mockResolvedValue(true)}
        onDelete={fn()}
        onComment={fn()}
      />
    </div>
  );
};

const meta = {
  title: 'Indicateurs/Tableau des valeurs/Navigation',
  component: NavigationTable,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NavigationTable>;
export default meta;

type Story = StoryObj<typeof meta>;

export const AjoutAnnees: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scrollbar = await canvas.findByRole('slider', {
      name: 'Défilement horizontal du tableau',
    });
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-test="indicateurs.valeurs.table"]'
    );
    if (!viewport) throw new Error('Table viewport missing');
    const input = canvas.getByRole('textbox', { name: 'Ajouter une année' });
    await expect(scrollbar).toBeVisible();
    for (const year of ['2028', '2015', '2012']) {
      await userEvent.type(input, year);
      await userEvent.keyboard('{Enter}');
      await waitFor(() => {
        const cell = viewport.querySelector<HTMLElement>(
          `[data-periode="${year}-01-01"]`
        );
        if (!cell) throw new Error('Period cell missing');
        const cellRect = cell.getBoundingClientRect();
        const pinned = viewport
          .querySelector<HTMLElement>('[data-pinned="right"]')
          ?.getBoundingClientRect();
        if (!pinned) throw new Error('Pinned column missing');
        expect(cellRect.left).toBeGreaterThanOrEqual(
          viewport.getBoundingClientRect().left
        );
        expect(cellRect.right).toBeLessThanOrEqual(pinned.left + 1);
      });
    }
    // Keep the control and the scrolling surface synchronized in both directions.
    scrollbar.focus();
    fireEvent.change(scrollbar, {
      target: { value: viewport.scrollWidth - viewport.clientWidth },
    });
    await waitFor(() =>
      expect(viewport.scrollLeft).toBeCloseTo(
        viewport.scrollWidth - viewport.clientWidth,
        0
      )
    );
    fireEvent.change(scrollbar, { target: { value: 0 } });
    await waitFor(() => expect(viewport.scrollLeft).toBe(0));

    const resultat = canvas.getByRole('button', { name: 'Résultat — 2014' });
    const objectif = canvas.getByRole('button', { name: 'Objectif — 2014' });
    const resultatHalf = resultat.parentElement;
    const objectifHalf = objectif.parentElement;
    if (!resultatHalf || !objectifHalf) throw new Error('Value slots missing');
    expect(
      Math.abs(
        resultatHalf.getBoundingClientRect().width -
          objectifHalf.getBoundingClientRect().width
      )
    ).toBeLessThanOrEqual(1);
    expect(resultatHalf.scrollWidth).toBeLessThanOrEqual(
      resultatHalf.clientWidth + 1
    );
    expect(objectifHalf.scrollWidth).toBeLessThanOrEqual(
      objectifHalf.clientWidth + 1
    );
    await userEvent.click(resultat);
    expect(
      Math.abs(
        resultatHalf.getBoundingClientRect().width -
          objectifHalf.getBoundingClientRect().width
      )
    ).toBeLessThanOrEqual(1);
    await userEvent.keyboard('{Escape}');
  },
};
