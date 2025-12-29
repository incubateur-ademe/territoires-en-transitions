import { Meta } from '@storybook/nextjs-vite';

import { IndicateurCardBase } from './IndicateurCard';

const props = {
  chartInfo: {
    definition: {
      id: 768,
      version: '1.0.0',
      groupementId: null,
      collectiviteId: 1,
      identifiantReferentiel: null,
      titre: 'Mon indicateur perso',
      titreLong: null,
      titreCourt: null,
      description: 'Description',
      unite: 'm2/hab',
      precision: 2,
      borneMin: null,
      borneMax: null,
      participationScore: false,
      sansValeurUtilisateur: false,
      valeurCalcule: null,
      exprCible: null,
      exprSeuil: null,
      libelleCibleSeuil: null,
      createdBy: null,
      modifiedBy: null,
      createdAt: '2025-10-02T08:23:47.792Z',
      modifiedAt: '2025-10-02T08:23:47.792Z',
      identifiant: null,
      commentaire: 'Mon commentaire',
      confidentiel: false,
      favoris: false,
      categories: null,
      thematiques: null,
      groupementCollectivites: null,
      enfants: null,
      ficheActions: null,
      mesures: null,
      parents: null,
      hasOpenData: false,
      estPerso: true,
      estAgregation: null,
    },
    typesSegmentation: [],
    segmentItemParId: {},
    sourceFilter: {
      isLoading: false,
      availableOptions: [
        {
          value: 'collectivite',
          label: 'Données de la collectivité',
        },
      ],
      filtresSource: [],
      avecDonneesCollectivite: true,
      avecSecteursSNBC: false,
      moyenne: {
        typeCollectivite: 'commune',
        valeurs: [],
      },
      valeursReference: null,
    },
    data: {
      unite: 'm2/hab',
      valeurs: {
        objectifs: {
          indicateurId: 768,
          sources: [
            {
              source: 'collectivite',
              metadonnees: [],
              valeurs: [
                {
                  id: 3,
                  calculAuto: false,
                  annee: 2021,
                  anneeISO: '2021-01-01T00:00:00.000Z',
                  valeur: 23.33,
                },
              ],
              libelle: '',
              ordreAffichage: null,
              calculAuto: false,
              type: 'objectif',
            },
          ],
          valeursExistantes: [
            {
              id: 3,
              collectiviteId: 1,
              dateValeur: '2021-01-01',
              resultat: 22.33,
              objectif: 23.33,
              confidentiel: false,
              annee: 2021,
            },
          ],
          annees: [2021],
        },
        resultats: {
          indicateurId: 768,
          anneeModePrive: 2021,
          sources: [
            {
              source: 'collectivite',
              valeurs: [
                {
                  id: 3,
                  calculAuto: false,
                  annee: 2021,
                  anneeISO: '2021-01-01T00:00:00.000Z',
                  valeur: 22.33,
                },
              ],
              libelle: '',
              ordreAffichage: null,
              calculAuto: false,
              type: 'resultat',
            },
          ],
          valeursExistantes: [
            {
              id: 3,
              collectiviteId: 1,
              dateValeur: '2021-01-01',
              resultat: 22.33,
              objectif: 23.33,
              confidentiel: false,
              annee: 2021,
            },
          ],
          annees: [2021],
        },
        segments: [],
      },
    },
    hasValeurCollectivite: true,
    hasValeur: true,
    isLoading: false,
  },
  definition: {
    id: 768,
    titre: 'Mon indicateur perso',
    estPerso: true,
    identifiant: null,
    hasOpenData: false,
  },
  href: '/collectivite/1/indicateurs/perso/768?',
  className: 'hover:!bg-white',
  hideChart: false,
  isEditable: true,
  readonly: false,
};

export default {
  component: IndicateurCardBase,
} as Meta;

export const Default = {
  args: props,
};
