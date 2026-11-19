import { getIndicateurValeurFieldLabel } from '@/app/indicateurs/valeurs/grid/indicateur-valeur.field';
import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import type { IndicateurChartValue } from '../detail/context/indicateur-chart.context';
import { IndicateurChartProvider } from '../detail/context/indicateur-chart.context';
import { IndicateurValeursTable } from './indicateur-valeurs-table';

type PeriodeSource = IndicateurPeriodeData['sources'][number];

const PERIODE_2022 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2022'
);
const PERIODE_2023 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2023'
);

const chart = {
  chartInfo: {
    getColorBySourceId: () => 'grey',
    getSourceLabel: (_source: string, label: string) => label,
  },
} as unknown as IndicateurChartValue;

const toLocalSource = ({
  valeurs,
}: {
  valeurs: readonly {
    periode: typeof PERIODE_2022;
    valeur: number | null;
    commentaire?: string;
  }[];
}): PeriodeSource =>
  ({
    source: 'collectivite',
    libelle: 'Collectivité',
    metadonnees: [],
    calculAuto: false,
    type: 'resultat',
    valeurs: valeurs.map(({ periode, valeur, commentaire }, index) => ({
      id: index + 1,
      calculAuto: false,
      periode,
      periodeLabel: IndicateurPeriodes.format(periode),
      dateValeurISO: `${periode.dateDebut}T00:00:00.000Z`,
      valeur,
      commentaire: commentaire ?? null,
    })),
  } as unknown as PeriodeSource);

const toPeriodeData = (source: PeriodeSource): IndicateurPeriodeData => ({
  indicateurId: 1,
  periodes: source.valeurs.map(({ periode }) => periode),
  periodeModePrive: undefined,
  sources: [source],
  donneesCollectivite: source,
  valeursExistantes: source.valeurs.map(({ id, periode }) => ({
    id,
    periode,
  })) as unknown as IndicateurPeriodeData['valeursExistantes'],
});

const RESULTATS = toPeriodeData(
  toLocalSource({
    valeurs: [
      { periode: PERIODE_2022, valeur: 5 },
      { periode: PERIODE_2023, valeur: null },
    ],
  })
);
const OBJECTIFS = toPeriodeData(
  toLocalSource({
    valeurs: [
      { periode: PERIODE_2022, valeur: 8 },
      { periode: PERIODE_2023, valeur: 9 },
    ],
  })
);

const INDICATEUR = {
  titre: 'Déchets',
  unite: 't',
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
};

const renderTable = ({ readonly = false }: { readonly?: boolean } = {}) => {
  const onSave = vi.fn().mockResolvedValue(true);
  const onDelete = vi.fn();
  const onComment = vi.fn();
  render(
    <IndicateurChartProvider value={chart}>
      <IndicateurValeursTable
        indicateur={INDICATEUR}
        resultats={RESULTATS}
        objectifs={OBJECTIFS}
        readonly={readonly}
        onSave={onSave}
        onDelete={onDelete}
        onComment={onComment}
      />
    </IndicateurChartProvider>
  );
  return { onSave, onDelete, onComment };
};

const LABEL_2022 = IndicateurPeriodes.format(PERIODE_2022);
const LABEL_2023 = IndicateurPeriodes.format(PERIODE_2023);
const RESULTAT_2022_LABEL = getIndicateurValeurFieldLabel(
  'resultat',
  LABEL_2022
);

describe('IndicateurValeursTable', () => {
  it("affiche le titre de l'indicateur puis une colonne par période", () => {
    renderTable();

    const headers = screen.getAllByRole('columnheader');

    expect(headers.map((header) => header.textContent)).toEqual([
      'Déchets (t)',
      LABEL_2022,
      LABEL_2023,
    ]);
  });

  it("n'épingle pas le titre de l'indicateur au défilement horizontal", () => {
    renderTable();

    expect(
      screen.getByRole('columnheader', { name: 'Déchets (t)' }).className
    ).not.toContain('sticky');
  });

  it('affiche une ligne pour la source collectivité, nommée par son libellé', () => {
    renderTable();

    expect(
      screen.getByRole('rowheader', { name: appLabels.sourceCollectivite })
    ).toBeDefined();
  });

  it('place le résultat et l’objectif de chaque période dans une même cellule', () => {
    renderTable({ readonly: true });

    const cell = screen
      .getByLabelText(RESULTAT_2022_LABEL, { exact: false })
      .closest('td');

    expect(cell).not.toBeNull();
    expect(within(cell as HTMLElement).getByText('5')).toBeDefined();
    expect(within(cell as HTMLElement).getByText('8')).toBeDefined();
  });

  it('enregistre le résultat saisi avec la période de la colonne', async () => {
    const { onSave } = renderTable();

    fireEvent.click(
      screen.getByRole('button', {
        name: RESULTAT_2022_LABEL,
      })
    );
    const input = screen.getByRole('textbox', {
      name: RESULTAT_2022_LABEL,
    });
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(PERIODE_2022, 'resultat', 12)
    );
  });

  it('ne propose ni saisie, ni suppression de période, ni commentaire à saisir en lecture seule', () => {
    renderTable({ readonly: true });

    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('demande la suppression de la période dont la corbeille est cliquée', () => {
    const { onDelete } = renderTable();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSupprimerPeriode(LABEL_2022),
      })
    );

    expect(onDelete).toHaveBeenCalledWith(PERIODE_2022);
  });

  it('ouvre les commentaires de la période du bouton cliqué', () => {
    const { onComment } = renderTable();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurCommentairesPeriode(LABEL_2023),
      })
    );

    expect(onComment).toHaveBeenCalledWith(PERIODE_2023);
  });
});
