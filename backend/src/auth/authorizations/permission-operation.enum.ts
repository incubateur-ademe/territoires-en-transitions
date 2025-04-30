import { createEnumObject } from '@/backend/utils/enum.utils';

export const PermissionOperations = [
  // Collectivités
  'collectivites.visite',
  'collectivites.lecture',
  'collectivites.edition',
  // TABLEAU DE BORD
  'collectivites.tableau-de-bord.edition',
  // Référentiels
  'referentiels.lecture',
  'referentiels.visite',
  'referentiels.edition',
  'referentiels.audit',
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
  // Membres
  'membres.edition',
  'membres.lecture',
  // Tags
  'tags.edition',
  'tags.lecture',
] as const;

export type PermissionOperationType = (typeof PermissionOperations)[number];

export const PermissionOperationEnum = createEnumObject(PermissionOperations);
