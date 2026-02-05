import { z } from 'zod/mini';
import { createEnumObject } from '../../utils';

export const platformRoleEnumValues = [
  'CONNECTED',
  'VERIFIED',
  'SUPPORT',
  'SUPER_ADMIN',
  'ADEME',
] as const;

export const PlatformRole = createEnumObject(platformRoleEnumValues);

export const platformRoleSchema = z.enum(PlatformRole);

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

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
  AUDITEUR_AUDIT_NON_DEMARRE: 'auditeur_audit_non_demarre',
  AUDITEUR: 'auditeur',
} as const;

export const auditRoleSchema = z.enum(AuditRole);

export type AuditRole = (typeof AuditRole)[keyof typeof AuditRole];

export const auditRoleEnumValues = [
  AuditRole.AUDITEUR_AUDIT_NON_DEMARRE,
  AuditRole.AUDITEUR,
] as const;

export function isAuditRole(role: UserRole): role is AuditRole {
  return auditRoleEnumValues.includes(role as AuditRole);
}

//

export type UserRole = PlatformRole | CollectiviteRole | AuditRole;
