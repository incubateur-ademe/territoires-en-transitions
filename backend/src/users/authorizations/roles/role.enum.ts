export enum UserRole {
  CONNECTE = 'Connecté',
  VERIFIE = 'Vérifié',
  SUPPORT = 'Support',
  ADEME = 'Ademe',
}

export enum CollectiviteRole {
  LECTURE = 'Lecture',
  EDITION = 'Edition',
  ADMIN = 'Admin',
}

export enum AuditRole {
  AUDITEUR = 'Auditeur',
}

export type Role = UserRole | CollectiviteRole | AuditRole;
