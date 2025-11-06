import { CollectiviteAccessLevel } from './collectivite-access-level.enum.schema';

export enum UserRole {
  CONNECTE = 'Connecté',
  VERIFIE = 'Vérifié',
  SUPPORT = 'Support',
  ADEME = 'Ademe',
}

export enum AuditRole {
  AUDITEUR = 'auditeur',
}

export type Role = UserRole | CollectiviteAccessLevel | AuditRole;
