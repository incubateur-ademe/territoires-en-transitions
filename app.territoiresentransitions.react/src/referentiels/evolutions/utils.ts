import { RouterOutput } from '@/api/utils/trpc/client';

export type SnapshotJalon =
  RouterOutput['referentiels']['snapshots']['updateName'][number]['jalon'];

export const isAuditOrEMT = (jalon: SnapshotJalon, snapshotRef: string) => {
  // Snapshots with jalon pre-audit or post-audit
  const AUDIT_JALONS = ['pre_audit', 'post_audit'];

  // Snapshots with references like "2024-labellisation-EMT" are non editable
  // TODO: replace with jalon check when labellisation jalons will be implemented
  const LABELLISATION_REF = /^\d{4}-labellisation-EMT$/;

  return (
    (jalon && AUDIT_JALONS.includes(jalon)) ||
    LABELLISATION_REF.test(snapshotRef)
  );
};

export const sortByDate = (dateA: string, dateB: string, ascending = true) => {
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  return ascending ? timeA - timeB : timeB - timeA;
};
