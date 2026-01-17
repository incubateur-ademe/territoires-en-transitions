import { z } from 'zod/mini';

export const PlatformRole = {
  CONNECTE: 'Connecté',
  VERIFIE: 'Vérifié',
  SUPPORT: 'Support',
  SUPPORT_MODE_ENABLED: 'Support mode enabled',
  ADEME: 'Ademe',
} as const;

export const platformRoleSchema = z.enum(PlatformRole);

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const platformRoleEnumValues = [
  PlatformRole.CONNECTE,
  PlatformRole.VERIFIE,
  PlatformRole.SUPPORT,
  PlatformRole.SUPPORT_MODE_ENABLED,
  PlatformRole.ADEME,
] as const;

export function isPlatformRole(role: UserRole): role is PlatformRole {
  return platformRoleEnumValues.includes(role as PlatformRole);
}

//

export const CollectiviteRole = {
  LECTURE: 'lecture',
  EDITION_FICHES_INDICATEURS: 'edition_fiches_indicateurs',
  EDITION: 'edition',
  ADMIN: 'admin',
} as const;

export type CollectiviteRole =
  (typeof CollectiviteRole)[keyof typeof CollectiviteRole];

export const collectiviteRoleSchema = z.enum(CollectiviteRole);

export const collectiviteRoleEnumValues = [
  CollectiviteRole.LECTURE,
  CollectiviteRole.EDITION_FICHES_INDICATEURS,
  CollectiviteRole.EDITION,
  CollectiviteRole.ADMIN,
] as const;

export function isCollectiviteRole(role: UserRole): role is CollectiviteRole {
  return collectiviteRoleEnumValues.includes(role as CollectiviteRole);
}

//

export const AuditRole = {
  AUDITEUR: 'auditeur',
} as const;

export const auditRoleSchema = z.enum(AuditRole);

export type AuditRole = (typeof AuditRole)[keyof typeof AuditRole];

export const auditRoleEnumValues = [AuditRole.AUDITEUR] as const;

export function isAuditRole(role: UserRole): role is AuditRole {
  return auditRoleEnumValues.includes(role as AuditRole);
}

//

export type UserRole = PlatformRole | CollectiviteRole | AuditRole;
