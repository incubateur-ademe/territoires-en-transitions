import {
  auditPreuvesArchiveInFlightStatuses,
  type AuditPreuvesArchive,
} from '../models/audit-preuves-archive.table';

export const MAX_ARCHIVES_PER_AUDIT_USER = 10;

export type DeletableArchive = Pick<
  AuditPreuvesArchive,
  'id' | 'status' | 'storagePath' | 'expiresAt' | 'createdAt'
>;

export interface SelectArchivesToDeleteOptions {
  now: Date;
  keepMostRecent: number;
}

export function selectArchivesToDelete(
  archives: DeletableArchive[],
  { now, keepMostRecent }: SelectArchivesToDeleteOptions
): DeletableArchive[] {
  const fromMostRecent = [...archives].sort(
    (a, b) =>
      Number(a.createdAt < b.createdAt) - Number(a.createdAt > b.createdAt)
  );
  const nowMs = now.getTime();

  return fromMostRecent.filter((archive, rank) => {
    const isInFlight = auditPreuvesArchiveInFlightStatuses.includes(
      archive.status
    );
    if (isInFlight) {
      return false;
    }
    const isExpired = new Date(archive.expiresAt).getTime() <= nowMs;
    const isBeyondLimit = rank >= keepMostRecent;
    return isExpired || isBeyondLimit;
  });
}
