import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import { toIndicateurActions } from '../../../table/to-indicateur-actions.fixture';
import { IndicateurActionsProvider } from '../../context/indicateur-actions.context';
import { IndicateurDataProvider } from '../../context/indicateur-data.context';
import { IndicateurPredefiniToolbar } from './indicateur-predefini-toolbar.view';

vi.mock('../../../chart/indicateur-chart.png-export', () => ({
  IndicateurChartPngExport: () => (
    <div role="status" aria-label="export du graphique du parent" />
  ),
}));
vi.mock(
  '../../content/sous-indicateurs/indicateur-sous-indicateurs-chart.png-export',
  () => ({
    IndicateurSousIndicateursChartPngExport: () => (
      <div
        role="status"
        aria-label="export du graphique des sous-indicateurs"
      />
    ),
  })
);

const toIndicateur = ({
  sansValeurUtilisateur,
}: {
  sansValeurUtilisateur: boolean;
}): IndicateurDetaille =>
  ({
    id: 10,
    collectiviteId: null,
    groupementId: null,
    identifiantReferentiel: 'emission_polluants_atmo',
    titre: 'Émissions de polluants atmosphériques',
    unite: 'tonnes',
    periodicite: 'annuelle',
    totalEstCumulDesSousIndicateurs: true,
    sansValeurUtilisateur,
    estFavori: false,
    enfants: [{ id: 11, titre: 'NOx' }],
  } as IndicateurDetaille);

const renderToolbar = ({
  sansValeurUtilisateur,
  hasValeurPropre = false,
}: {
  sansValeurUtilisateur: boolean;
  hasValeurPropre?: boolean;
}) =>
  render(
    <IndicateurDataProvider
      value={{
        indicateur: toIndicateur({ sansValeurUtilisateur }),
        canMutateIndicateur: true,
        canMutateValeur: true,
      }}
    >
      <IndicateurActionsProvider value={toIndicateurActions()}>
        <IndicateurPredefiniToolbar
          chartInfo={{ hasValeur: hasValeurPropre } as IndicateurChartInfo}
          hasCollectivitePermission={() => true}
        />
      </IndicateurActionsProvider>
    </IndicateurDataProvider>
  );

const TELECHARGER_LE_GRAPHIQUE = { name: appLabels.telechargerLeGraphiquePng };

const openOptions = (): void => {
  fireEvent.click(
    screen.getByRole('button', { name: appLabels.indicateurOptions })
  );
};

describe('IndicateurPredefiniToolbar : téléchargement du graphique', () => {
  it("télécharge le graphique des sous-indicateurs d'un composé, qui n'a pas de valeur propre", () => {
    renderToolbar({ sansValeurUtilisateur: true });

    openOptions();
    fireEvent.click(screen.getByRole('button', TELECHARGER_LE_GRAPHIQUE));

    expect(
      screen.getByRole('status', {
        name: 'export du graphique des sous-indicateurs',
      })
    ).toBeDefined();
  });

  it("télécharge le graphique du parent pour un indicateur qui porte ses propres valeurs, même s'il a des sous-indicateurs", () => {
    renderToolbar({ sansValeurUtilisateur: false, hasValeurPropre: true });

    openOptions();
    fireEvent.click(screen.getByRole('button', TELECHARGER_LE_GRAPHIQUE));

    expect(
      screen.getByRole('status', { name: 'export du graphique du parent' })
    ).toBeDefined();
    expect(
      screen.queryByRole('status', {
        name: 'export du graphique des sous-indicateurs',
      })
    ).toBeNull();
  });

  it("ne propose pas de télécharger le graphique d'un parent sans valeur propre qui n'est pas un composé", () => {
    renderToolbar({ sansValeurUtilisateur: false });

    openOptions();

    expect(screen.queryByRole('button', TELECHARGER_LE_GRAPHIQUE)).toBeNull();
  });
});
