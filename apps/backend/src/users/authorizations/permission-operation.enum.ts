import { createEnumObject } from '@/backend/utils/enum.utils';

export const PermissionOperations = [
  // Collectivités
  'collectivites.visite',
  'collectivites.lecture',
  'collectivites.edition',
  // Tableau de bord
  'collectivites.tableau-de-bord.edition',
  // Membres
  'collectivites.membres.edition',
  'collectivites.membres.lecture',
  // Tags
  'collectivites.tags.edition',
  'collectivites.tags.lecture',

  // Référentiels
  'referentiels.lecture',
  'referentiels.visite',
  'referentiels.edition',
  'referentiels.audit',

  // Plans
  'plans.visite',
  'plans.lecture',
  'plans.edition',

  // Fiches actions
  'plans.fiches.edition',
  'plans.fiches.lecture',
  'plans.fiches.visite',
  'plans.fiches.import',

  // Indicateurs
  'indicateurs.lecture',
  'indicateurs.visite',
  'indicateurs.edition',
  'indicateurs.trajectoires.lecture',
  'indicateurs.trajectoires.edition',
] as const;

export type PermissionOperation = (typeof PermissionOperations)[number];

export const PermissionOperationEnum = createEnumObject(PermissionOperations);
