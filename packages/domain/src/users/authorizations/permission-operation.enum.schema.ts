import z from 'zod';
import { createEnumObject } from '../../utils/enum.utils';

export const PermissionOperations = [
  // Collectivités
  'collectivites.read',
  'collectivites.read_confidentiel',
  'collectivites.mutate',
  // Tableau de bord
  'collectivites.tableau-de-bord.mutate',
  // Membres
  'collectivites.membres.read',
  'collectivites.membres.mutate',
  // Tags
  'collectivites.tags.read',
  'collectivites.tags.mutate',
  // Documents
  'collectivites.documents.read',
  'collectivites.documents.read_confidentiel',
  'collectivites.documents.create',

  // Référentiels
  'referentiels.read',
  'referentiels.read_confidentiel',
  'referentiels.mutate',
  'referentiels.labellisations.request',
  'referentiels.labellisations.start_audit',
  'referentiels.labellisations.validate_audit',
  'referentiels.labellisations.mutate_audit_statut',
  'referentiels.discussions.read',
  'referentiels.discussions.mutate',

  // Plans
  'plans.read',
  'plans.read_confidentiel',
  'plans.mutate',

  // Fiches actions
  'plans.fiches.read',
  'plans.fiches.read_confidentiel',
  'plans.fiches.create',
  'plans.fiches.update',
  'plans.fiches.update_piloted_by_me',
  'plans.fiches.bulk_update',
  'plans.fiches.delete',
  'plans.fiches.import',

  // Indicateurs
  'indicateurs.indicateurs.read',
  'indicateurs.indicateurs.read_confidentiel',
  'indicateurs.indicateurs.create',
  'indicateurs.indicateurs.update',
  'indicateurs.indicateurs.update_piloted_by_me',
  'indicateurs.indicateurs.delete',
  'indicateurs.valeurs.read',
  'indicateurs.valeurs.read_confidentiel',
  'indicateurs.valeurs.mutate',
  'indicateurs.valeurs.mutate_piloted_by_me',

  // Utilisateurs
  'users.authorizations.mutate_super_admin_role',
] as const;

export const permissionOperationEnumSchema = z.enum(PermissionOperations);

export type PermissionOperation = (typeof PermissionOperations)[number];

export const PermissionOperationEnum = createEnumObject(PermissionOperations);
