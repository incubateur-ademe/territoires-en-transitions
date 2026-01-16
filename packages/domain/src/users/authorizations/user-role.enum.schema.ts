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

export const CollectiviteRoleEnum = {
  LECTURE: 'lecture',
  EDITION_FICHES_INDICATEURS: 'edition_fiches_indicateurs',
  EDITION: 'edition',
  ADMIN: 'admin',
} as const;

export type CollectiviteRole =
  (typeof CollectiviteRoleEnum)[keyof typeof CollectiviteRoleEnum];

export const collectiviteRoleEnumValues = [
  CollectiviteRoleEnum.LECTURE,
  CollectiviteRoleEnum.EDITION_FICHES_INDICATEURS,
  CollectiviteRoleEnum.EDITION,
  CollectiviteRoleEnum.ADMIN,
] as const;

export const collectiviteRoleSchema = z.enum(CollectiviteRoleEnum);

//

export const AuditRole = {
  AUDITEUR: 'auditeur',
};

export const auditRoleSchema = z.enum(AuditRole);

export type AuditRole = (typeof AuditRole)[keyof typeof AuditRole];

//

export type UserRole = PlatformRole | CollectiviteRole | AuditRole;
