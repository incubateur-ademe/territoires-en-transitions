import { FicheWithRelations } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import {
  getDescriptionSearchScope,
  getFichesRestreintesAccess,
  hasFilterOnMaskedField,
  maskFicheRestreinte,
  maskFichesRestreintes,
  toFichesWithReadableBudget,
} from './fiches-restreintes.rules';

const pilote = {
  tagId: 3,
  userId: null,
  nom: 'Léo Bazin',
  collectiviteId: 10,
};

const service = { id: 4, nom: 'Ressources humaines', collectiviteId: 10 };

const plan = {
  id: 5,
  nom: 'Plan de bifurcation écologique',
  collectiviteId: 10,
  type: null,
};

const axe = {
  id: 6,
  nom: 'Mobilité douce',
  collectiviteId: 10,
  parentId: 5,
  planId: 5,
};

const toFicheRestreinte = (): FicheWithRelations => ({
  id: 1,
  collectiviteId: 10,
  collectiviteNom: 'Ville test',
  parentId: null,
  titre: 'Relever les déplacements doux',
  description: 'Description confidentielle',
  piliersEci: ['Approvisionnement durable'],
  objectifs: 'Objectifs confidentiels',
  cibles: ['Grand public'],
  ressources: 'Moyens confidentiels',
  financements: 'Financements confidentiels',
  budgetPrevisionnel: '12000',
  statut: 'En cours',
  priorite: 'Élevé',
  dateDebut: '2026-01-01',
  dateFin: '2026-03-04',
  ameliorationContinue: true,
  participationCitoyenne: 'Concertation',
  participationCitoyenneType: 'information',
  tempsDeMiseEnOeuvre: { id: 1, nom: 'Court terme' },
  majTermine: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: {
    id: '00000000-0000-0000-0000-000000000001',
    prenom: 'A',
    nom: 'B',
  },
  modifiedAt: '2026-08-17T00:00:00.000Z',
  modifiedBy: {
    id: '00000000-0000-0000-0000-000000000001',
    prenom: 'A',
    nom: 'B',
  },
  restreint: true,
  partenaires: [{ id: 7, nom: 'Partenaire' }],
  pilotes: [pilote],
  referents: [pilote],
  libreTags: [{ id: 8, nom: 'Tag' }],
  instanceGouvernance: [{ id: 9, nom: 'Comité' }],
  financeurs: [],
  sousThematiques: [],
  thematiques: [{ id: 11, nom: 'Mobilité' }],
  structures: [],
  sharedWithCollectivites: [{ id: 12, nom: 'Ville voisine' }],
  indicateurs: [{ id: 13, nom: 'Agents à vélo', unite: 'nb' }],
  services: [service],
  effetsAttendus: [],
  axes: [axe],
  plans: [plan],
  etapes: [{ nom: 'Enquête', realise: false, ordre: 1 }],
  notes: [],
  mesures: [],
  fichesLiees: [],
  docs: [{ id: 14 }],
  budgets: [],
  actionImpactId: 15,
  completion: { ficheId: 1, fields: [], isCompleted: true },
});

describe('maskFicheRestreinte', () => {
  it('garde les champs de la carte et vide tous les autres', () => {
    expect(maskFicheRestreinte(toFicheRestreinte())).toEqual({
      id: 1,
      collectiviteId: 10,
      collectiviteNom: 'Ville test',
      parentId: null,
      titre: 'Relever les déplacements doux',
      statut: 'En cours',
      priorite: 'Élevé',
      dateDebut: '2026-01-01',
      dateFin: '2026-03-04',
      ameliorationContinue: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-08-17T00:00:00.000Z',
      restreint: true,
      pilotes: [pilote],
      services: [service],
      plans: [plan],
      axes: [axe],
      sharedWithCollectivites: [{ id: 12, nom: 'Ville voisine' }],
      actionImpactId: 15,
      completion: {
        ficheId: 1,
        fields: [
          { field: 'titre', isCompleted: true },
          { field: 'description', isCompleted: false },
          { field: 'statut', isCompleted: true },
          { field: 'pilotes', isCompleted: true },
        ],
        isCompleted: false,
      },
      description: null,
      piliersEci: null,
      objectifs: null,
      cibles: null,
      ressources: null,
      financements: null,
      budgetPrevisionnel: null,
      participationCitoyenne: null,
      participationCitoyenneType: null,
      tempsDeMiseEnOeuvre: null,
      majTermine: null,
      createdBy: null,
      modifiedBy: null,
      partenaires: null,
      referents: null,
      libreTags: null,
      instanceGouvernance: null,
      financeurs: null,
      sousThematiques: null,
      thematiques: null,
      structures: null,
      indicateurs: null,
      effetsAttendus: null,
      etapes: null,
      notes: null,
      mesures: null,
      fichesLiees: null,
      docs: null,
      budgets: null,
    });
  });
});

describe('hasFilterOnMaskedField', () => {
  it('ne voit aucun champ masqué dans des filtres sur le statut, le pilote et le plan', () => {
    expect(
      hasFilterOnMaskedField({
        statuts: ['En cours'],
        utilisateurPiloteIds: ['00000000-0000-0000-0000-000000000001'],
        planActionIds: [5],
        restreint: true,
      })
    ).toBe(false);
  });

  it('ne voit aucun champ masqué dans une recherche texte, limitée au titre pour les fiches restreintes', () => {
    expect(hasFilterOnMaskedField({ texteNomOuDescription: 'vélo' })).toBe(
      false
    );
  });

  it('ignore un filtre de thématiques vide', () => {
    expect(hasFilterOnMaskedField({ thematiqueIds: [] })).toBe(false);
  });

  it('voit un champ masqué dans un filtre booléen à false', () => {
    expect(hasFilterOnMaskedField({ noDescription: false })).toBe(true);
  });

  it('ignore un filtre masqué non renseigné', () => {
    expect(hasFilterOnMaskedField({ noDescription: undefined })).toBe(false);
  });
});

describe('getFichesRestreintesAccess', () => {
  it('rend les fiches restreintes lisibles à qui a le droit de lecture confidentielle, même sur un champ masqué', () => {
    expect(
      getFichesRestreintesAccess({
        canReadFichesRestreintes: true,
        filters: { noDescription: false },
        readsMaskedFields: true,
      })
    ).toEqual('readable');
  });

  it('masque les fiches restreintes sans droit ni filtre sur un champ masqué', () => {
    expect(
      getFichesRestreintesAccess({
        canReadFichesRestreintes: false,
        filters: { statuts: ['En cours'] },
        readsMaskedFields: false,
      })
    ).toEqual('masked');
  });

  it('écarte les fiches restreintes sans droit quand un filtre porte sur un champ masqué', () => {
    expect(
      getFichesRestreintesAccess({
        canReadFichesRestreintes: false,
        filters: { noDescription: false },
        readsMaskedFields: false,
      })
    ).toEqual('excluded');
  });

  it('masque les fiches restreintes sans droit quand le filtre est une recherche texte', () => {
    expect(
      getFichesRestreintesAccess({
        canReadFichesRestreintes: false,
        filters: { texteNomOuDescription: 'vélo' },
        readsMaskedFields: false,
      })
    ).toEqual('masked');
  });

  it("écarte les fiches restreintes sans droit quand l'appelant lit un champ masqué", () => {
    expect(
      getFichesRestreintesAccess({
        canReadFichesRestreintes: false,
        filters: {},
        readsMaskedFields: true,
      })
    ).toEqual('excluded');
  });
});

describe('getDescriptionSearchScope', () => {
  it.each([
    { access: 'readable', scope: 'all' },
    { access: 'masked', scope: 'unrestrictedFichesOnly' },
    { access: 'excluded', scope: 'unrestrictedFichesOnly' },
  ] as const)(
    'cherche dans la description de $scope avec un accès $access',
    ({ access, scope }) => {
      expect(getDescriptionSearchScope(access)).toEqual(scope);
    }
  );
});

const ficheNonRestreinte: FicheWithRelations = {
  ...toFicheRestreinte(),
  id: 2,
  restreint: false,
};

const ficheRestreinteNull: FicheWithRelations = {
  ...toFicheRestreinte(),
  id: 3,
  restreint: null,
};

describe('maskFichesRestreintes', () => {
  it('masque la fiche restreinte et garde entières les fiches à restreint false ou null', () => {
    expect(
      maskFichesRestreintes([
        toFicheRestreinte(),
        ficheNonRestreinte,
        ficheRestreinteNull,
      ])
    ).toEqual([
      maskFicheRestreinte(toFicheRestreinte()),
      ficheNonRestreinte,
      ficheRestreinteNull,
    ]);
  });
});

describe('toFichesWithReadableBudget', () => {
  const fiches = [toFicheRestreinte(), ficheNonRestreinte, ficheRestreinteNull];

  it('écarte la fiche restreinte sans droit de lecture confidentielle', () => {
    expect(
      toFichesWithReadableBudget({ fiches, canReadFichesRestreintes: false })
    ).toEqual([ficheNonRestreinte, ficheRestreinteNull]);
  });

  it('garde toutes les fiches avec le droit de lecture confidentielle', () => {
    expect(
      toFichesWithReadableBudget({ fiches, canReadFichesRestreintes: true })
    ).toEqual(fiches);
  });
});
