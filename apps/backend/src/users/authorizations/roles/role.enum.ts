import { PermissionLevel } from './permission-level.enum';

export enum UserRole {
  CONNECTE = 'Connecté',
  VERIFIE = 'Vérifié',
  SUPPORT = 'Support',
  ADEME = 'Ademe',
}

export enum AuditRole {
  AUDITEUR = 'auditeur',
}

export type Role = UserRole | PermissionLevel | AuditRole;
