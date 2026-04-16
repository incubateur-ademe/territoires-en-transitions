import { appLabels } from '@/app/labels/catalog';
import {
  Cible,
  ParticipationCitoyenne,
  Priorite,
  Statut,
} from '@tet/domain/plans';
import { ModifiedSince } from '@tet/domain/utils';

type Options<T extends string> = {
  value: T;
  label: T | string;
  disabled?: boolean;
}[];

export const ficheActionCiblesOptions: Options<Cible> = [
  { value: 'Grand public', label: appLabels.cibleGrandPublic },
  { value: 'Associations', label: appLabels.cibleAssociations },
  { value: 'Public Scolaire', label: appLabels.ciblePublicScolaire },
  { value: 'Acteurs économiques', label: appLabels.cibleActeursEconomiques },
  {
    value: 'Acteurs économiques du secteur primaire',
    label: appLabels.cibleActeursEconomiquesPrimaire,
  },
  {
    value: 'Acteurs économiques du secteur secondaire',
    label: appLabels.cibleActeursEconomiquesSecondaire,
  },
  {
    value: 'Acteurs économiques du secteur tertiaire',
    label: appLabels.cibleActeursEconomiquesTertiaire,
  },
  { value: 'Partenaires', label: appLabels.ciblePartenaires },
  {
    value: 'Autres collectivités du territoire',
    label: appLabels.cibleAutresCollectivites,
  },
  {
    value: 'Collectivité elle-même',
    label: appLabels.cibleCollectiviteElleMeme,
  },
  { value: 'Elus locaux', label: appLabels.cibleElusLocaux },
  { value: 'Agents', label: appLabels.cibleAgents },
];

export const ficheActionStatutOptions: Options<Statut> = [
  { value: 'À venir', label: appLabels.statutAVenir },
  { value: 'A discuter', label: appLabels.statutADiscuter },
  { value: 'En cours', label: appLabels.statutEnCours },
  { value: 'Réalisé', label: appLabels.statutRealise },
  { value: 'En retard', label: appLabels.statutEnRetard },
  { value: 'En pause', label: appLabels.statutEnPause },
  { value: 'Abandonné', label: appLabels.statutAbandonne },
  { value: 'Bloqué', label: appLabels.statutBloque },
];

export const ficheActionNiveauPrioriteOptions: Options<Priorite> = [
  { value: 'Élevé', label: appLabels.prioriteEleve },
  { value: 'Moyen', label: appLabels.prioriteMoyen },
  { value: 'Bas', label: appLabels.prioriteBas },
];

export const ficheActionModifiedSinceOptions: Options<ModifiedSince> = [
  { value: 'last-15-days', label: appLabels.modifiedSinceLast15 },
  { value: 'last-30-days', label: appLabels.modifiedSinceLast30 },
  { value: 'last-60-days', label: appLabels.modifiedSinceLast60 },
  { value: 'last-90-days', label: appLabels.modifiedSinceLast90 },
];

export const ficheActionParticipationOptions: Options<ParticipationCitoyenne> =
  [
    { value: 'pas-de-participation', label: appLabels.participationPas },
    { value: 'information', label: appLabels.information },
    { value: 'consultation', label: appLabels.participationConsultation },
    { value: 'concertation', label: appLabels.participationConcertation },
    { value: 'co-construction', label: appLabels.participationCoConstruction },
  ];
