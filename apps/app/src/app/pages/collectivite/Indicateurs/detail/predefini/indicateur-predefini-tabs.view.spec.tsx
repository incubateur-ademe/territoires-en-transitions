import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurDataProvider } from '../context/indicateur-data.context';
import { IndicateurPredefiniTabs } from './indicateur-predefini-tabs.view';

const renderDonneesPerso = vi.hoisted(() => vi.fn());
const renderDonneesAvecEnfants = vi.hoisted(() => vi.fn());

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({
    hasCollectivitePermission: () => false,
    isSimplifiedView: false,
  }),
}));
vi.mock('../content/donnees/indicateur-donnees.view', () => ({
  IndicateurDonnees: () => {
    renderDonneesPerso();
    return null;
  },
}));
vi.mock('./donnees/indicateur-predefini-avec-enfants-donnees.view', () => ({
  IndicateurPredefiniAvecEnfantsDonnees: () => {
    renderDonneesAvecEnfants();
    return null;
  },
}));
vi.mock('../content/fiches-liees/indicateur-fiches-liees.view', () => ({
  IndicateurFichesLiees: () => null,
}));
vi.mock('./informations/indicateur-informations.view', () => ({
  IndicateurInformations: () => null,
}));
vi.mock('./mesures-liees/indicateur-mesures-liees.view', () => ({
  IndicateurMesuresLiees: () => null,
}));

const toIndicateur = ({
  enfants,
  sansValeurUtilisateur = false,
}: {
  enfants: { id: number; titre: string }[];
  sansValeurUtilisateur?: boolean;
}): IndicateurDetaille =>
  ({
    id: 10,
    collectiviteId: null,
    identifiantReferentiel: 'cae_1.a',
    groupementId: null,
    titre: 'Déchets',
    unite: 't',
    sansValeurUtilisateur,
    enfants,
  } as IndicateurDetaille);

const deuxEnfants = [
  { id: 11, titre: 'Ménagers' },
  { id: 12, titre: 'Verre' },
];

const renderTabs = (indicateur: IndicateurDetaille) =>
  render(
    <IndicateurDataProvider
      value={{
        indicateur,
        canMutateIndicateur: true,
        canMutateValeur: true,
      }}
    >
      <IndicateurPredefiniTabs />
    </IndicateurDataProvider>
  );

const sousIndicateursTab = { name: /sous-indicateurs?/i };

const clearRenders = () => {
  renderDonneesPerso.mockClear();
  renderDonneesAvecEnfants.mockClear();
};

describe('IndicateurPredefiniTabs : indicateur prédéfini avec enfants', () => {
  it.each([
    ['avec valeurs propres', false],
    ['composé sans valeur propre', true],
  ])(
    "affiche le tableau des sous-indicateurs dans l'onglet Données pour un parent %s",
    (_, sansValeurUtilisateur) => {
      clearRenders();

      renderTabs(toIndicateur({ enfants: deuxEnfants, sansValeurUtilisateur }));

      expect(renderDonneesAvecEnfants).toHaveBeenCalledTimes(1);
      expect(renderDonneesPerso).not.toHaveBeenCalled();
    }
  );

  it("n'a plus d'onglet de sous-indicateurs en cartes", () => {
    clearRenders();

    renderTabs(toIndicateur({ enfants: deuxEnfants }));

    expect(screen.queryByRole('tab', sousIndicateursTab)).toBeNull();
  });
});

describe('IndicateurPredefiniTabs : indicateur prédéfini sans enfant', () => {
  it("affiche la vue des données d'un indicateur sans tableau de sous-indicateurs", () => {
    clearRenders();

    renderTabs(toIndicateur({ enfants: [] }));

    expect(renderDonneesPerso).toHaveBeenCalledTimes(1);
    expect(renderDonneesAvecEnfants).not.toHaveBeenCalled();
  });
});
