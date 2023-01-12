import {
  TFicheActionCibles,
  TFicheActionNiveauxPriorite,
  TFicheActionResultatsAttendus,
  TFicheActionStatuts,
} from '../types/alias';

// type Options<T extends string> = {value: T; label: T}[];
type Options<T extends string> = {value: T; label: T}[];

// export const ficheActionThematiquesOptions: Options<TFicheActionThematiques> = [
//   {value: 'Agriculture et alimentation', label: 'Agriculture et alimentation'},
//   {value: 'Bâtiments', label: 'Bâtiments'},
//   {value: 'Déchets', label: 'Déchets'},
//   {value: 'Développement économique', label: 'Développement économique'},
//   {value: 'Eau', label: 'Eau'},
//   {
//     value: 'Forêts, biodiversité et espaces verts',
//     label: 'Forêts, biodiversité et espaces verts',
//   },
//   {
//     value: 'Formation, sensibilisation, communication',
//     label: 'Formation, sensibilisation, communication',
//   },
//   {
//     value: 'Gestion, production et distribution de l’énergie',
//     label: 'Gestion, production et distribution de l’énergie',
//   },
//   {value: 'Mobilité', label: 'Mobilité'},
//   {value: 'Organisation interne', label: 'Organisation interne'},
//   {value: 'Partenariats et coopération', label: 'Partenariats et coopération'},
//   {value: 'Précarité énergétique', label: 'Précarité énergétique'},
//   {value: 'Stratégie', label: 'Stratégie'},
//   {value: 'Tourisme', label: 'Tourisme'},
//   {value: 'Urbanisme et aménagement', label: 'Urbanisme et aménagement'},
// ];

export const ficheActionResultatsAttendusOptions: Options<TFicheActionResultatsAttendus> =
  [
    {
      value: 'Adaptation au changement climatique',
      label: 'Adaptation au changement climatique',
    },
    {
      value: 'Allongement de la durée d’usage',
      label: 'Allongement de la durée d’usage',
    },
    {
      value: 'Amélioration de la qualité de vie',
      label: 'Amélioration de la qualité de vie',
    },
    {
      value: 'Développement des énergies renouvelables',
      label: 'Développement des énergies renouvelables',
    },
    {value: 'Efficacité énergétique', label: 'Efficacité énergétique'},
    {
      value: 'Préservation de la biodiversité',
      label: 'Préservation de la biodiversité',
    },
    {
      value: 'Réduction des consommations énergétiques',
      label: 'Réduction des consommations énergétiques',
    },
    {value: 'Réduction des déchets', label: 'Réduction des déchets'},
    {
      value: 'Réduction des polluants atmosphériques',
      label: 'Réduction des polluants atmosphériques',
    },
    {
      value: 'Réduction des émissions de gaz à effet de serre',
      label: 'Réduction des émissions de gaz à effet de serre',
    },
    {value: 'Sobriété énergétique', label: 'Sobriété énergétique'},
  ];

export const ficheActionCiblesOptions: Options<TFicheActionCibles> = [
  {
    value: 'Grand public et associations',
    label: 'Grand public et associations',
  },
  {
    value: 'Autres collectivités du territoire',
    label: 'Autres collectivités du territoire',
  },
  {value: 'Acteurs économiques', label: 'Acteurs économiques'},
];

export const ficheActionStatutOptions: Options<TFicheActionStatuts> = [
  {value: 'À venir', label: 'À venir'},
  {value: 'En cours', label: 'En cours'},
  {value: 'Réalisé', label: 'Réalisé'},
  {value: 'En pause', label: 'En pause'},
  {value: 'Abandonné', label: 'Abandonné'},
];

export const ficheActionNiveauPrioriteOptions: Options<TFicheActionNiveauxPriorite> =
  [
    {value: 'Élevé', label: 'Élevé'},
    {value: 'Moyen', label: 'Moyen'},
    {value: 'Bas', label: 'Bas'},
  ];
