import { getIndicateurValeurFieldLabel } from '@/app/indicateurs/valeurs/grid/indicateur-valeur.field';
import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  type IndicateurDetaille,
} from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { PreparedData } from '../data/prepare-data';
import { IndicateurActionsProvider } from '../detail/context/indicateur-actions.context';
import {
  IndicateurChartProvider,
  type IndicateurChartValue,
} from '../detail/context/indicateur-chart.context';
import { IndicateurDataProvider } from '../detail/context/indicateur-data.context';
import { IndicateurTable } from './indicateur-table';
import { toIndicateurActions } from './to-indicateur-actions.fixture';

const PERIODE_2022 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2022'
);
const LABEL_2022 = IndicateurPeriodes.format(PERIODE_2022);
const RESULTAT_2022_LABEL = getIndicateurValeurFieldLabel(
  'resultat',
  LABEL_2022
);

const toPreparedData = (valeurSaisie: number | null): PreparedData => {
  const valeur = {
    id: 7,
    calculAuto: false,
    periode: PERIODE_2022,
    periodeLabel: LABEL_2022,
    dateValeurISO: `${PERIODE_2022.dateDebut}T00:00:00.000Z`,
    valeur: valeurSaisie,
    commentaire: null,
  };
  const source = {
    source: 'collectivite',
    libelle: 'Collectivité',
    metadonnees: [],
    calculAuto: false,
    type: 'resultat',
    valeurs: [valeur],
  };
  return {
    indicateurId: 1,
    dernierePeriodeModePrive: undefined,
    periodes: [PERIODE_2022],
    sources: [source],
    donneesCollectivite: source,
    valeursExistantes: [{ id: 7, periode: PERIODE_2022 }],
  } as unknown as PreparedData;
};

const toChart = (valeurSaisie: number | null): IndicateurChartValue =>
  ({
    chartInfo: {
      data: {
        valeurs: {
          resultats: toPreparedData(valeurSaisie),
          objectifs: toPreparedData(valeurSaisie),
        },
      },
      sourceFilter: { avecDonneesCollectivite: true },
      getColorBySourceId: () => 'grey',
      getSourceLabel: (_source: string, label: string) => label,
    },
  } as unknown as IndicateurChartValue);

const renderTable = ({
  readonly = false,
  estConfidentiel = false,
  valeurSaisie = null,
}: {
  readonly?: boolean;
  estConfidentiel?: boolean;
  valeurSaisie?: number | null;
} = {}) => {
  const actions = toIndicateurActions();
  render(
    <IndicateurDataProvider
      value={{
        indicateur: {
          id: 1,
          titre: 'Déchets',
          unite: 't',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          estConfidentiel,
          sansValeurUtilisateur: false,
        } as IndicateurDetaille,
        canMutateIndicateur: true,
        canMutateValeur: true,
      }}
    >
      <IndicateurChartProvider value={toChart(valeurSaisie)}>
        <IndicateurActionsProvider value={actions}>
          <IndicateurTable readonly={readonly} />
        </IndicateurActionsProvider>
      </IndicateurChartProvider>
    </IndicateurDataProvider>
  );
  return actions;
};

describe('IndicateurTable', () => {
  it("enregistre la valeur saisie avec l'identité de la valeur existante de la période", async () => {
    const actions = renderTable();

    fireEvent.click(screen.getByRole('button', { name: RESULTAT_2022_LABEL }));
    const input = screen.getByRole('textbox', { name: RESULTAT_2022_LABEL });
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await vi.waitFor(() =>
      expect(actions.saveValeur).toHaveBeenCalledWith({
        id: 7,
        dateValeur: PERIODE_2022.dateDebut,
        periodicite: PERIODE_2022.periodicite,
        resultat: 12,
      })
    );
  });

  it('supprime sans confirmation une période dont la valeur existante est vide', () => {
    const actions = renderTable();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurSupprimerPeriode(LABEL_2022),
      })
    );

    expect(actions.deleteValeur).toHaveBeenCalledWith(7);
  });

  it('ne propose aucune action en lecture seule', () => {
    renderTable({ readonly: true });

    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it("bascule le mode privé de l'indicateur depuis l'interrupteur", () => {
    const actions = renderTable({ estConfidentiel: false, valeurSaisie: 5 });

    fireEvent.click(screen.getByRole('checkbox'));

    expect(actions.updateIndicateur).toHaveBeenCalledWith({
      estConfidentiel: true,
    });
  });
});
