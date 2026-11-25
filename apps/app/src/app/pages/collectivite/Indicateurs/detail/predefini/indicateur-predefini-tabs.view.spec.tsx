import { appLabels } from '@/app/labels/catalog';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurDataProvider } from '../context/indicateur-data.context';
import { IndicateurPredefiniTabs } from './indicateur-predefini-tabs.view';

const renderSousIndicateursListe = vi.hoisted(() => vi.fn());
const renderDonneesParent = vi.hoisted(() => vi.fn());
const renderDonneesCompose = vi.hoisted(() => vi.fn());

vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({
    hasCollectivitePermission: () => false,
    isSimplifiedView: false,
  }),
}));
vi.mock('./donnees/indicateur-predefini-donnees.view', () => ({
  IndicateurPredefiniDonnees: () => {
    renderDonneesParent();
    return null;
  },
}));
vi.mock('./donnees/indicateur-predefini-compose-donnees.view', () => ({
  IndicateurPredefiniComposeDonnees: () => {
    renderDonneesCompose();
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
vi.mock('./sous-indicateurs/indicateur-sous-indicateurs.view', () => ({
  IndicateurSousIndicateurs: (props: {
    enfantsIds: number[];
    isReadonly: boolean;
  }) => {
    renderSousIndicateursListe(props);
    return null;
  },
}));

const toIndicateur = (): IndicateurDetaille =>
  ({
    id: 10,
    collectiviteId: null,
    identifiantReferentiel: 'cae_1.a',
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
      <IndicateurPredefiniTabs />
    </IndicateurDataProvider>
  );

const sousIndicateursTab = (indicateur: IndicateurDetaille) => ({
  name: appLabels.sousIndicateur({ count: indicateur.enfants.length }),
});

describe('IndicateurPredefiniTabs : onglet des sous-indicateurs', () => {
  it('garde la liste des sous-indicateurs dans un onglet pour un indicateur prédéfini', () => {
    renderSousIndicateursListe.mockClear();
    const indicateur = toIndicateur();

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
    const indicateur = toIndicateur();

    renderTabs({ indicateur, canMutateIndicateur: false });
    fireEvent.click(screen.getByRole('tab', sousIndicateursTab(indicateur)));

    expect(renderSousIndicateursListe.mock.calls[0][0]).toEqual({
      enfantsIds: [11, 12],
      isReadonly: true,
    });
  });
});

describe('IndicateurPredefiniTabs : indicateur composé sans valeur propre', () => {
  const toCompose = (): IndicateurDetaille =>
    ({
      ...toIndicateur(),
      identifiantReferentiel: 'emission_polluants_atmo',
      sansValeurUtilisateur: true,
    } as IndicateurDetaille);

  it("affiche les sous-indicateurs en tableau dans l'onglet Données, à la place de la liste de cartes", () => {
    renderDonneesParent.mockClear();
    renderDonneesCompose.mockClear();

    renderTabs({ indicateur: toCompose() });

    expect(renderDonneesCompose).toHaveBeenCalledTimes(1);
    expect(renderDonneesParent).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('tab', sousIndicateursTab(toCompose()))
    ).toBeNull();
  });

  it("garde l'onglet Données habituel pour un parent qui porte ses propres valeurs", () => {
    renderDonneesParent.mockClear();
    renderDonneesCompose.mockClear();

    renderTabs({ indicateur: toIndicateur() });

    expect(renderDonneesParent).toHaveBeenCalledTimes(1);
    expect(renderDonneesCompose).not.toHaveBeenCalled();
  });
});
