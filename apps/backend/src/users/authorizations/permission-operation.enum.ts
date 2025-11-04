import { createEnumObject } from '@/backend/utils/enum.utils';
import z from 'zod';

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

  // Référentiels
  'referentiels.read',
  'referentiels.read_public',
  'referentiels.mutate',
  'referentiels.audit',

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
  'plans.fiches.read_piloted_by_me',
  'plans.fiches.read_public',
  'plans.fiches.import',

  // Indicateurs
  'indicateurs.read',
  'indicateurs.read_public',
  'indicateurs.read_piloted_by_me',
  'indicateurs.create',
  'indicateurs.update',
  'indicateurs.update_piloted_by_me',
  'indicateurs.delete',
  'indicateurs.valeurs.mutate',
  'indicateurs.valeurs.mutate_piloted_by_me',
] as const;

export const permissionOperationEnumSchema = z.enum(PermissionOperations);

export type PermissionOperation = (typeof PermissionOperations)[number];

export const PermissionOperationEnum = createEnumObject(PermissionOperations);
