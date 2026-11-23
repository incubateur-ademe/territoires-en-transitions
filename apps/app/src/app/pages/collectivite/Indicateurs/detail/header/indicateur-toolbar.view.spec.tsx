import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { toIndicateurActions } from '../../table/to-indicateur-actions.fixture';
import { IndicateurActionsProvider } from '../context/indicateur-actions.context';
import { IndicateurDataProvider } from '../context/indicateur-data.context';
import { IndicateurNouveauSousIndicateurProvider } from '../perso/context/indicateur-nouveau-sous-indicateur.context';
import { IndicateurSousIndicateursTableProvider } from '../perso/context/indicateur-sous-indicateurs-table.context';
import IndicateurToolbar from './indicateur-toolbar.view';

vi.mock('../../chart/indicateur-chart.png-export', () => ({
  IndicateurChartPngExport: () => (
    <div role="status" aria-label="export du graphique du parent" />
  ),
}));
vi.mock(
  '../perso/sous-indicateurs/indicateur-sous-indicateurs-chart.png-export',
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
  enfants,
}: {
  enfants: { id: number; titre: string }[];
}): IndicateurDetaille =>
  ({
    id: 10,
    titre: 'Déchets',
    unite: 't',
    periodicite: 'annuelle',
    totalEstCumulDesSousIndicateurs: true,
    estFavori: false,
    enfants,
  } as IndicateurDetaille);

const renderToolbar = ({
  isPerso = true,
  canMutateIndicateur = true,
  enfants = [],
  hasValeurPropre = false,
}: {
  isPerso?: boolean;
  canMutateIndicateur?: boolean;
  enfants?: { id: number; titre: string }[];
  hasValeurPropre?: boolean;
} = {}) => {
  const createSousIndicateur = vi.fn();
  const onCreated = vi.fn();
  render(
    <IndicateurDataProvider
      value={{
        indicateur: toIndicateur({ enfants }),
        canMutateIndicateur,
        canMutateValeur: true,
      }}
    >
      <IndicateurActionsProvider value={toIndicateurActions()}>
        <IndicateurSousIndicateursTableProvider
          value={
            {
              useCreateSousIndicateur: () => createSousIndicateur,
            } as never
          }
        >
          <IndicateurNouveauSousIndicateurProvider
            value={{ id: null, onCreated, onNameEditingEnd: vi.fn() }}
          >
            <IndicateurToolbar
              chartInfo={{ hasValeur: hasValeurPropre } as IndicateurChartInfo}
              hasCollectivitePermission={() => true}
              isPerso={isPerso}
            />
          </IndicateurNouveauSousIndicateurProvider>
        </IndicateurSousIndicateursTableProvider>
      </IndicateurActionsProvider>
    </IndicateurDataProvider>
  );
  return { createSousIndicateur, onCreated };
};

const CREER = { name: appLabels.indicateurCreerSousIndicateur };

describe('IndicateurToolbar : création d un sous-indicateur', () => {
  it("crée un sous-indicateur nommé à la suite des enfants directs et transmet l'identifiant créé pour le focus", () => {
    const { createSousIndicateur, onCreated } = renderToolbar({
      enfants: [
        { id: 11, titre: 'Ménagers' },
        { id: 12, titre: 'Verre' },
      ],
    });

    fireEvent.click(screen.getByRole('button', CREER));

    expect(createSousIndicateur).toHaveBeenCalledWith(
      { parentId: 10, titre: 'Sous-indicateur 3' },
      { onCreated }
    );
  });

  it('a la même taille que les boutons favori et menu du bandeau', () => {
    renderToolbar();

    const { className } = screen.getByRole('button', CREER);

    expect(className).toContain('text-xs');
    expect(className).not.toContain('text-sm');
  });

  it('ne propose pas la création pour un indicateur prédéfini', () => {
    renderToolbar({ isPerso: false });

    expect(screen.queryByRole('button', CREER)).toBeNull();
  });

  it("ne propose pas la création sans le droit de modifier l'indicateur", () => {
    renderToolbar({ canMutateIndicateur: false });

    expect(screen.queryByRole('button', CREER)).toBeNull();
  });
});

const OPTIONS = { name: appLabels.indicateurOptions };
const TELECHARGER_LE_GRAPHIQUE = { name: appLabels.telechargerLeGraphiquePng };

const openOptions = (): void => {
  fireEvent.click(screen.getByRole('button', OPTIONS));
};

describe('IndicateurToolbar : téléchargement du graphique', () => {
  it("propose de télécharger le graphique d'un perso qui a des sous-indicateurs, même sans valeur propre", () => {
    renderToolbar({ enfants: [{ id: 11, titre: 'Ménagers' }] });

    openOptions();

    expect(screen.getByRole('button', TELECHARGER_LE_GRAPHIQUE)).toBeDefined();
  });

  it('télécharge le graphique du parent pour un indicateur qui a des valeurs et pas de sous-indicateur', () => {
    renderToolbar({ isPerso: false, hasValeurPropre: true });

    openOptions();
    fireEvent.click(screen.getByRole('button', TELECHARGER_LE_GRAPHIQUE));

    expect(
      screen.getByRole('status', { name: 'export du graphique du parent' })
    ).toBeDefined();
  });

  it('ne propose pas de télécharger le graphique sans sous-indicateur ni valeur', () => {
    renderToolbar();

    openOptions();

    expect(
      screen.getByRole('button', { name: appLabels.indicateurTelechargerExcel })
    ).toBeDefined();
    expect(screen.queryByRole('button', TELECHARGER_LE_GRAPHIQUE)).toBeNull();
  });

  it("télécharge le graphique des sous-indicateurs plutôt que celui du parent quand l'indicateur a des sous-indicateurs", () => {
    renderToolbar({
      enfants: [{ id: 11, titre: 'Ménagers' }],
      hasValeurPropre: true,
    });

    openOptions();
    fireEvent.click(screen.getByRole('button', TELECHARGER_LE_GRAPHIQUE));

    expect(
      screen.getByRole('status', {
        name: 'export du graphique des sous-indicateurs',
      })
    ).toBeDefined();
    expect(
      screen.queryByRole('status', { name: 'export du graphique du parent' })
    ).toBeNull();
  });
});
