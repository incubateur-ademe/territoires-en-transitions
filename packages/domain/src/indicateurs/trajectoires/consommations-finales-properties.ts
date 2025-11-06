import { IndicateurSourceEnum } from './indicateur-source.enum';
import {
  TrajectoireSecteursEnum,
  TrajectoireSecteursType,
} from './trajectoire-secteurs';
import { TrajectoirePropertiesType } from './types';

const CONSOMMATIONS_FINALES_IDENTIFIANT = 'cae_2.a';
const CONSOMMATIONS_FINALES_UNITE = 'GWh';

const CONSOMMATIONS_FINALES_SOURCES = [
  IndicateurSourceEnum.CITEPA,
  IndicateurSourceEnum.RARE,
  IndicateurSourceEnum.COLLECTIVITE,
];

const CONSOMMATIONS_FINALES_SECTEURS: TrajectoirePropertiesType<TrajectoireSecteursType>['secteurs'] =
  [
    {
      nom: TrajectoireSecteursEnum.RÉSIDENTIEL,
      identifiant: 'cae_2.e',
      sousSecteurs: [
        { nom: 'Chauffage / Maisons individuelles', identifiant: 'cae_2.ea' },
        { nom: 'Chauffage / Logement collectif', identifiant: 'cae_2.eb' },
        { nom: 'Autres usages', identifiant: 'cae_2.ec' },
      ],
    },
    {
      nom: TrajectoireSecteursEnum.TERTIAIRE,
      identifiant: 'cae_2.f',
      sousSecteurs: [
        { nom: 'Chauffage', identifiant: 'cae_2.fa' },
        { nom: 'Autres usages', identifiant: 'cae_2.fb' },
      ],
    },
    {
      nom: TrajectoireSecteursEnum.INDUSTRIE,
      identifiant: 'cae_2.k',
      sousSecteurs: [
        { nom: 'Métaux primaires', identifiant: 'cae_2.ka' },
        { nom: 'Chimie', identifiant: 'cae_2.kb' },
        { nom: 'Non-métalliques', identifiant: 'cae_2.kc' },
        { nom: 'Agro-industries', identifiant: 'cae_2.kd' },
        { nom: 'Equipements', identifiant: 'cae_2.ke' },
        { nom: 'Papier-carton', identifiant: 'cae_2.kf' },
        { nom: 'Autres industries', identifiant: 'cae_2.kg' },
      ],
    },
    { nom: TrajectoireSecteursEnum.AGRICULTURE, identifiant: 'cae_2.i' },
    { nom: TrajectoireSecteursEnum.TRANSPORTS, identifiant: 'cae_2.m' },
    { nom: TrajectoireSecteursEnum.DÉCHETS, identifiant: 'cae_2.j' },
    {
      nom: TrajectoireSecteursEnum['BRANCHE ÉNERGIE'],
      identifiant: 'cae_2.l_pcaet',
    },
  ];

export const CONSOMMATIONS_FINALES_PROPERTIES: TrajectoirePropertiesType<TrajectoireSecteursType> =
  {
    identifiant: CONSOMMATIONS_FINALES_IDENTIFIANT,
    unite: CONSOMMATIONS_FINALES_UNITE,
    sources: CONSOMMATIONS_FINALES_SOURCES,
    secteurs: CONSOMMATIONS_FINALES_SECTEURS,
  };
