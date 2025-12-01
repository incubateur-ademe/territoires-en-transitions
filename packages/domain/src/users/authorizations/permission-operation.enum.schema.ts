import z from 'zod';
import { createEnumObject } from '../../utils/enum.utils';

export const PermissionOperations = [
  // Collectivités
  'collectivites.read_public',
  'collectivites.read',
  'collectivites.mutate',
  // Tableau de bord
  'collectivites.tableau-de-bord.mutate',
  // Membres
  'collectivites.membres.mutate',
  'collectivites.membres.read',
  // Tags
  'collectivites.tags.mutate',
  'collectivites.tags.read',
  // Documents
  'collectivites.documents.read',
  'collectivites.documents.create',

  // Référentiels
  'referentiels.read',
  'referentiels.read_public',
  'referentiels.mutate',
  'referentiels.audit',
  'referentiels.discussions.read',
  'referentiels.discussions.mutate',

  // Plans
  'plans.read_public',
  'plans.read',
  'plans.mutate',

  // Fiches actions
  'plans.fiches.create',
  'plans.fiches.update',
  'plans.fiches.update_piloted_by_me',
  'plans.fiches.bulk_update',
  'plans.fiches.delete',
  'plans.fiches.read',
  'plans.fiches.read_public',
  'plans.fiches.import',

  // Indicateurs
  'indicateurs.definitions.read',
  'indicateurs.definitions.read_public',
  'indicateurs.definitions.create',
  'indicateurs.definitions.update',
  'indicateurs.definitions.update_piloted_by_me',
  'indicateurs.definitions.delete',
  'indicateurs.valeurs.read',
  'indicateurs.valeurs.read_public',
  'indicateurs.valeurs.mutate',
  'indicateurs.valeurs.mutate_piloted_by_me',
] as const;

export const permissionOperationEnumSchema = z.enum(PermissionOperations);

export type PermissionOperation = (typeof PermissionOperations)[number];

export const PermissionOperationEnum = createEnumObject(PermissionOperations);
