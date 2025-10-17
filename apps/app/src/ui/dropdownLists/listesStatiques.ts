import {
  Cible,
  ParticipationCitoyenne,
  Priorite,
  Statut,
} from '@/domain/plans';
import { ModifiedSince } from '@/domain/utils';

type Options<T extends string> = {
  value: T;
  label: T | string;
  disabled?: boolean;
}[];

export const ficheActionCiblesOptions: Options<Cible> = [
  {
    value: 'Grand public',
    label: 'Grand public',
  },
  {
    value: 'Associations',
    label: 'Associations',
  },
  {
    value: 'Public Scolaire',
    label: 'Public Scolaire',
  },
  {
    value: 'Acteurs économiques',
    label: 'Acteurs économiques',
  },
  {
    value: 'Acteurs économiques du secteur primaire',
    label: 'Acteurs économiques du secteur primaire',
  },
  {
    value: 'Acteurs économiques du secteur secondaire',
    label: 'Acteurs économiques du secteur secondaire',
  },
  {
    value: 'Acteurs économiques du secteur tertiaire',
    label: 'Acteurs économiques du secteur tertiaire',
  },
  {
    value: 'Partenaires',
    label: 'Partenaires',
  },
  {
    value: 'Autres collectivités du territoire',
    label: 'Autres collectivités du territoire',
  },
  {
    value: 'Collectivité elle-même',
    label: 'Collectivité elle-même',
  },
  {
    value: 'Elus locaux',
    label: 'Elus locaux',
  },
  {
    value: 'Agents',
    label: 'Agents',
  },
];

export const ficheActionStatutOptions: Options<Statut> = [
  { value: 'À venir', label: 'À venir' },
  { value: 'A discuter', label: 'À discuter' },
  { value: 'En cours', label: 'En cours' },
  { value: 'Réalisé', label: 'Réalisé' },
  { value: 'En retard', label: 'En retard' },
  { value: 'En pause', label: 'En pause' },
  { value: 'Abandonné', label: 'Abandonné' },
  { value: 'Bloqué', label: 'Bloqué' },
];

export const ficheActionNiveauPrioriteOptions: Options<Priorite> = [
  { value: 'Élevé', label: 'Élevé' },
  { value: 'Moyen', label: 'Moyen' },
  { value: 'Bas', label: 'Bas' },
];

export const ficheActionModifiedSinceOptions: Options<ModifiedSince> = [
  { value: 'last-15-days', label: 'les 15 derniers jours' },
  { value: 'last-30-days', label: 'les 30 derniers jours' },
  { value: 'last-60-days', label: 'les 60 derniers jours' },
  { value: 'last-90-days', label: 'les 90 derniers jours' },
];

export const ficheActionParticipationOptions: Options<ParticipationCitoyenne> =
  [
    {
      value: 'pas-de-participation',
      label: 'Pas de participation citoyenne',
    },
    { value: 'information', label: 'Information' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'concertation', label: 'Concertation' },
    { value: 'co-construction', label: 'Co-construction' },
  ];
