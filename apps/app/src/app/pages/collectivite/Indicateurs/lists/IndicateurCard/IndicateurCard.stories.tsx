import { Meta } from '@storybook/nextjs-vite';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import type { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';

import { IndicateurCardBase } from './IndicateurCard';
import type { IndicateurCardBaseProps } from './IndicateurCard';

const periode = IndicateurPeriods.parse('annuelle', '2021');
const definition = {
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
  periodicite: 'annuelle',
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
  commentaire: 'Mon commentaire',
  estConfidentiel: false,
  estFavori: false,
  categories: [],
  thematiques: [],
  pilotes: [],
  services: [],
  groupementCollectivites: [],
  enfants: [],
  parent: null,
  fiches: [],
  mesures: [],
  hasOpenData: false,
  estPerso: true,
  estAgregation: false,
  estRempli: true,
} satisfies IndicateurDefinitionListItem;

const props = {
  chartInfo: {
    definition,
    typesSegmentation: [],
    segmentation: undefined,
    setSegmentation: () => undefined,
    segmentItemParId: new Map(),
    sourceFilter: {
      isLoading: false,
      availableOptions: [
        {
          value: 'collectivite',
          label: 'Données de la collectivité',
        },
      ],
      filtresSource: [],
      setFiltresSource: () => undefined,
      sources: undefined,
      avecDonneesCollectivite: true,
      avecSecteursSNBC: false,
      moyenne: {
        indicateurId: 768,
        typeCollectivite: 'commune',
        valeurs: [],
      },
      valeursReference: null,
    },
    data: {
      unite: 'm2/hab',
      periodicite: 'annuelle',
      valeurs: {
        objectifs: {
          indicateurId: 768,
          dernierePeriodeModePrive: undefined,
          sources: [
            {
              source: 'collectivite',
              metadonnees: [],
              valeurs: [
                {
                  id: 3,
                  calculAuto: false,
                  periode,
                  periodeLabel: '2021',
                  dateValeurISO: '2021-01-01T00:00:00.000Z',
                  valeur: 23.33,
                  commentaire: null,
                },
              ],
              libelle: '',
              ordreAffichage: null,
              calculAuto: false,
              type: 'objectif',
            },
          ],
          donneesCollectivite: undefined,
          valeursExistantes: [
            {
              id: 3,
              collectiviteId: 1,
              dateValeur: '2021-01-01',
              resultat: 22.33,
              objectif: 23.33,
              confidentiel: false,
              periode,
              periodeLabel: '2021',
            },
          ],
          periodes: [periode],
        },
        resultats: {
          indicateurId: 768,
          dernierePeriodeModePrive: periode,
          sources: [
            {
              source: 'collectivite',
              metadonnees: [],
              valeurs: [
                {
                  id: 3,
                  calculAuto: false,
                  periode,
                  periodeLabel: '2021',
                  dateValeurISO: '2021-01-01T00:00:00.000Z',
                  valeur: 22.33,
                  commentaire: null,
                },
              ],
              libelle: '',
              ordreAffichage: null,
              calculAuto: false,
              type: 'resultat',
            },
          ],
          donneesCollectivite: undefined,
          valeursExistantes: [
            {
              id: 3,
              collectiviteId: 1,
              dateValeur: '2021-01-01',
              resultat: 22.33,
              objectif: 23.33,
              confidentiel: false,
              periode,
              periodeLabel: '2021',
            },
          ],
          periodes: [periode],
        },
        segments: [],
      },
    },
    hasValeurCollectivite: true,
    hasValeur: true,
    isLoading: false,
  },
  definition,
  href: '/collectivite/1/indicateurs/perso/768?',
  className: 'hover:!bg-white',
  hideChart: false,
  isEditable: true,
  readonly: false,
} satisfies IndicateurCardBaseProps;

export default {
  component: IndicateurCardBase,
} as Meta;

export const Default = {
  args: props,
};
