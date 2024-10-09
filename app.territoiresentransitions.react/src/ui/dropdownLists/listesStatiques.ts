import { Statut } from '@tet/api/plan-actions';
import { ModifiedSince } from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import {
  TFicheActionCibles,
  TFicheActionEcheances,
  TFicheActionNiveauxPriorite,
} from 'types/alias';

type Options<T extends string> = {
  value: T;
  label: T | string;
  disabled?: boolean;
}[];

export const ficheActionCiblesOptions: Options<TFicheActionCibles> = [
  {
    value: 'Grand public et associations',
    label: 'Grand public et associations',
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

export const ficheActionNiveauPrioriteOptions: Options<TFicheActionNiveauxPriorite> =
  [
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

export const ficheActionEcheanceOptions: Options<TFicheActionEcheances> = [
  {
    value: 'Action en amélioration continue',
    label: 'Action en amélioration continue',
  },
  { value: 'Sans échéance', label: 'Sans échéance' },
  { value: 'Échéance dépassée', label: 'Échéance dépassée' },
  {
    value: 'Échéance dans moins de trois mois',
    label: 'Échéance dans moins de trois mois',
  },
  {
    value: 'Échéance entre trois mois et 1 an',
    label: 'Échéance entre trois mois et 1 an',
  },
  { value: 'Échéance dans plus d’un an', label: 'Échéance dans plus d’un an' },
];
