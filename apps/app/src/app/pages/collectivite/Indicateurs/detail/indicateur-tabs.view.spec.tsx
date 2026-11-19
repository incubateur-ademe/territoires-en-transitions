import { appLabels } from '@/app/labels/catalog';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurDataProvider } from './context/indicateur-data.context';
import { IndicateurTabs } from './indicateur-tabs.view';

const renderSousIndicateursListe = vi.hoisted(() => vi.fn());

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({
    hasCollectivitePermission: () => false,
    isSimplifiedView: false,
  }),
}));
vi.mock('./content/donnees/indicateur-donnees.view', () => ({
  IndicateurDonnees: () => null,
}));
vi.mock('./content/fiches-liees/indicateur-fiches-liees.view', () => ({
  IndicateurFichesLiees: () => null,
}));
vi.mock('./content/informations/indicateur-informations.view', () => ({
  IndicateurInformations: () => null,
}));
vi.mock('./content/mesures-liees/indicateur-mesures-liees.view', () => ({
  IndicateurMesuresLiees: () => null,
}));
vi.mock('./content/sous-indicateurs/indicateur-sous-indicateurs.view', () => ({
  IndicateurSousIndicateurs: (props: {
    enfantsIds: number[];
    isReadonly: boolean;
  }) => {
    renderSousIndicateursListe(props);
    return null;
  },
}));

const toIndicateur = (collectiviteId: number | null): IndicateurDetaille =>
  ({
    id: 10,
    collectiviteId,
    identifiantReferentiel: null,
    groupementId: null,
    titre: 'Déchets',
    unite: 't',
    sansValeurUtilisateur: false,
    enfants: [
      { id: 11, titre: 'Ménagers' },
      { id: 12, titre: 'Verre' },
    ],
  } as IndicateurDetaille);

const renderTabs = ({
  indicateur,
  canMutateIndicateur = true,
}: {
  indicateur: IndicateurDetaille;
  canMutateIndicateur?: boolean;
}) =>
  render(
    <IndicateurDataProvider
      value={{
        indicateur,
        canMutateIndicateur,
        canMutateValeur: true,
      }}
    >
      <IndicateurTabs />
    </IndicateurDataProvider>
  );

const sousIndicateursTab = (indicateur: IndicateurDetaille) => ({
  name: appLabels.sousIndicateur({ count: indicateur.enfants.length }),
});

describe('IndicateurTabs : onglet des sous-indicateurs', () => {
  it("n'a pas d'onglet des sous-indicateurs pour un indicateur perso, dont le tableau est dans l'onglet des données", () => {
    const indicateur = toIndicateur(1);

    renderTabs({ indicateur });

    expect(
      screen.getByRole('tab', { name: appLabels.indicateurOngletDonnees })
    ).toBeDefined();
    expect(
      screen.queryByRole('tab', sousIndicateursTab(indicateur))
    ).toBeNull();
  });

  it('garde la liste des sous-indicateurs dans un onglet pour un indicateur prédéfini', () => {
    renderSousIndicateursListe.mockClear();
    const indicateur = toIndicateur(null);

    renderTabs({ indicateur });
    fireEvent.click(screen.getByRole('tab', sousIndicateursTab(indicateur)));

    expect(renderSousIndicateursListe).toHaveBeenCalledTimes(1);
    expect(renderSousIndicateursListe.mock.calls[0][0]).toEqual({
      enfantsIds: [11, 12],
      isReadonly: false,
    });
  });

  it("passe la liste d'un indicateur prédéfini en lecture seule quand l'utilisateur ne peut pas le modifier", () => {
    renderSousIndicateursListe.mockClear();
    const indicateur = toIndicateur(null);

    renderTabs({ indicateur, canMutateIndicateur: false });
    fireEvent.click(screen.getByRole('tab', sousIndicateursTab(indicateur)));

    expect(renderSousIndicateursListe.mock.calls[0][0]).toEqual({
      enfantsIds: [11, 12],
      isReadonly: true,
    });
  });
});
