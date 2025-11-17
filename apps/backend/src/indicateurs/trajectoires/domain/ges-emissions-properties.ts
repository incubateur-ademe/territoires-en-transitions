import { SourceIndicateur } from './source-indicateur';
import {
  TrajectoireSecteursEnum,
  TrajectoireSecteursType,
} from './trajectoire-secteurs.enum';
import { TrajectoirePropertiesType } from './types';

const EMISSIONS_GES_UNITE = 'kteq CO2';
const EMISSIONS_GES_IDENTIFIANT = 'cae_1.a';

export const EMISSIONS_NETTES = {
  id: EMISSIONS_GES_IDENTIFIANT,
  nom: 'Émissions nettes',
};

const EMISSIONS_GES_SOURCES = [
  SourceIndicateur.CITEPA,
  SourceIndicateur.RARE,
  SourceIndicateur.COLLECTIVITE,
];

const EMISSIONS_GES_SECTEURS = [
  {
    nom: TrajectoireSecteursEnum.RÉSIDENTIEL,
    identifiant: 'cae_1.c',
    sousSecteurs: [
      {
        nom: 'Chauffage / Maisons individuelles',
        identifiant: 'cae_1.ca',
      },
      {
        nom: 'Chauffage / Logement collectif',
        identifiant: 'cae_1.cb',
      },
      {
        nom: 'Autres usages',
        identifiant: 'cae_1.cc',
      },
    ],
  },
  {
    nom: TrajectoireSecteursEnum.TERTIAIRE,
    identifiant: 'cae_1.d',
    sousSecteurs: [
      {
        nom: 'Chauffage',
        identifiant: 'cae_1.da',
      },
      {
        nom: 'Autres usages',
        identifiant: 'cae_1.db',
      },
    ],
  },
  {
    nom: TrajectoireSecteursEnum.INDUSTRIE,
    identifiant: 'cae_1.i',
    sousSecteurs: [
      {
        nom: 'Métaux primaires',
        identifiant: 'cae_1.ia',
      },
      {
        nom: 'Chimie',
        identifiant: 'cae_1.ib',
      },
      {
        nom: 'Non-métalliques',
        identifiant: 'cae_1.ic',
      },
      {
        nom: 'Agro-industries',
        identifiant: 'cae_1.id',
      },
      {
        nom: 'Equipements',
        identifiant: 'cae_1.ie',
      },
      {
        nom: 'Papier-carton',
        identifiant: 'cae_1.if',
      },
      {
        nom: 'Autres industries',
        identifiant: 'cae_1.ig',
      },
    ],
  },
  {
    nom: TrajectoireSecteursEnum.AGRICULTURE,
    identifiant: 'cae_1.g',
    sousSecteurs: [
      {
        nom: 'Energie',
        identifiant: 'cae_1.ga',
      },
      {
        nom: 'Elevage',
        identifiant: 'cae_1.gb',
      },
      {
        nom: 'Pratiques culturales',
        identifiant: 'cae_1.gc',
      },
    ],
  },
  {
    nom: TrajectoireSecteursEnum.TRANSPORTS,
    identifiant: 'cae_1.k',
    sousSecteurs: [
      {
        nom: 'Routier / mobilité locale',
        identifiant: 'cae_1.ea',
      },
      {
        nom: 'Routier / autre',
        identifiant: 'cae_1.eb',
      },
      {
        nom: 'Autres',
        identifiant: 'cae_1.f',
      },
    ],
  },
  {
    nom: TrajectoireSecteursEnum.DÉCHETS,
    identifiant: 'cae_1.h',
  },
  {
    nom: TrajectoireSecteursEnum['BRANCHE ÉNERGIE'],
    identifiant: 'cae_1.j',
  },
  {
    nom: TrajectoireSecteursEnum.UTCATF,
    identifiant: 'cae_63.a',
    sousSecteurs: [
      {
        nom: 'Forêts',
        identifiant: 'cae_63.b',
      },
      {
        nom: 'Cultures',
        identifiant: 'cae_63.ca',
      },
      {
        nom: 'Prairies',
        identifiant: 'cae_63.cb',
      },
      {
        nom: 'Zones humides',
        identifiant: 'cae_63.da',
      },
      {
        nom: 'Sols artificiels',
        identifiant: 'cae_63.db',
      },
      {
        nom: 'Produits bois',
        identifiant: 'cae_63.e',
      },
    ],
  },
  {
    nom: TrajectoireSecteursEnum.CSC,
    identifiant: 'cae_1.csc',
  },
];

export const EMISSIONS_GES_PROPERTIES: TrajectoirePropertiesType<TrajectoireSecteursType> =
  {
    identifiant: EMISSIONS_GES_IDENTIFIANT,
    unite: EMISSIONS_GES_UNITE,
    sources: EMISSIONS_GES_SOURCES,
    secteurs: EMISSIONS_GES_SECTEURS,
  };
