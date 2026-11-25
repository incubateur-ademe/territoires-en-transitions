import { appLabels } from '@/app/labels/catalog';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurDataProvider } from '../context/indicateur-data.context';
import { IndicateurPersoTabs } from './indicateur-perso-tabs.view';

const mocks = vi.hoisted(() => ({ canReadFiches: true }));

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({
    hasCollectivitePermission: (permission: string) =>
      permission === 'plans.fiches.read' && mocks.canReadFiches,
    isSimplifiedView: false,
  }),
}));
vi.mock('../content/donnees/indicateur-donnees.view', () => ({
  IndicateurDonnees: () => null,
}));
vi.mock('../content/fiches-liees/indicateur-fiches-liees.view', () => ({
  IndicateurFichesLiees: () => null,
}));

const indicateur = {
  id: 10,
  collectiviteId: 1,
  identifiantReferentiel: null,
  groupementId: null,
  titre: 'Déchets',
  unite: 't',
  description: 'Une description',
  sansValeurUtilisateur: false,
  enfants: [{ id: 11, titre: 'Ménagers' }],
} as unknown as IndicateurDetaille;

const renderTabs = () =>
  render(
    <IndicateurDataProvider
      value={{
        indicateur,
        canMutateIndicateur: true,
        canMutateValeur: true,
      }}
    >
      <IndicateurPersoTabs />
    </IndicateurDataProvider>
  );

describe('IndicateurPersoTabs', () => {
  it("n'a que les onglets des données et des actions liées, même avec des sous-indicateurs, des mesures et une description", () => {
    mocks.canReadFiches = true;

    renderTabs();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      appLabels.indicateurOngletDonnees,
      appLabels.actionsLiees,
    ]);
  });

  it("n'a pas l'onglet des actions liées sans le droit de lire les fiches", () => {
    mocks.canReadFiches = false;

    renderTabs();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      appLabels.indicateurOngletDonnees,
    ]);
  });
});
