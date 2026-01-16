import { z } from 'zod/mini';

export const PlatformRole = {
  CONNECTE: 'Connecté',
  VERIFIE: 'Vérifié',
  SUPPORT: 'Support',
  SUPPORT_MODE_ENABLED: 'Support mode enabled',
  ADEME: 'Ademe',
};

export const platformRoleSchema = z.enum(PlatformRole);

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

//

export const CollectiviteRole = {
  LECTURE: 'lecture',
  EDITION_FICHES_INDICATEURS: 'edition_fiches_indicateurs',
  EDITION: 'edition',
  ADMIN: 'admin',
} as const;

export type CollectiviteRole =
  (typeof CollectiviteRole)[keyof typeof CollectiviteRole];

export const collectiviteRoleEnumValues = [
  CollectiviteRole.LECTURE,
  CollectiviteRole.EDITION_FICHES_INDICATEURS,
  CollectiviteRole.EDITION,
  CollectiviteRole.ADMIN,
] as const;

export const collectiviteRoleSchema = z.enum(CollectiviteRole);

//

export const AuditRole = {
  AUDITEUR: 'auditeur',
};

export const auditRoleSchema = z.enum(AuditRole);

export type AuditRole = (typeof AuditRole)[keyof typeof AuditRole];

//

export type UserRole = PlatformRole | CollectiviteRole | AuditRole;
