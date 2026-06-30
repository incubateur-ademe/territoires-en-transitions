import { describe, expect, it } from 'vitest';
import { AuditPreuvesArchiveStatusEnum } from '../models/audit-preuves-archive.table';
import {
  MAX_ARCHIVES_PER_AUDIT_USER,
  selectArchivesToDelete,
  type DeletableArchive,
} from './select-archives-to-delete';

const now = new Date('2026-06-30T00:00:00.000Z');

function toArchive(
  overrides: Partial<DeletableArchive> & { id: string }
): DeletableArchive {
  return {
    status: AuditPreuvesArchiveStatusEnum.COMPLETED,
    storagePath: `${overrides.id}.zip`,
    expiresAt: '2026-07-07T00:00:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

const dayOf = (day: number) =>
  `2026-06-${String(day).padStart(2, '0')}T00:00:00.000Z`;

describe('selectArchivesToDelete', () => {
  it("ne supprime rien tant qu'il y a 10 archives fraîches ou moins", () => {
    const archives = Array.from(
      { length: MAX_ARCHIVES_PER_AUDIT_USER },
      (_, i) => toArchive({ id: `a-${i}`, createdAt: dayOf(10 + i) })
    );

    expect(
      selectArchivesToDelete(archives, {
        now,
        keepMostRecent: MAX_ARCHIVES_PER_AUDIT_USER,
      })
    ).toEqual([]);
  });

  it('supprime les plus vieilles au-delà de la 10e', () => {
    const archives = Array.from({ length: 12 }, (_, i) =>
      toArchive({ id: `a-${i}`, createdAt: dayOf(i + 1) })
    );

    const deleted = selectArchivesToDelete(archives, {
      now,
      keepMostRecent: MAX_ARCHIVES_PER_AUDIT_USER,
    });

    expect(deleted.map((archive) => archive.id)).toEqual(['a-1', 'a-0']);
  });

  it('supprime une archive expirée même dans les 10 plus récentes', () => {
    const archives = [
      toArchive({
        id: 'expiree',
        createdAt: dayOf(20),
        expiresAt: '2026-06-25T00:00:00.000Z',
      }),
      toArchive({ id: 'fraiche', createdAt: dayOf(28) }),
    ];

    const deleted = selectArchivesToDelete(archives, {
      now,
      keepMostRecent: MAX_ARCHIVES_PER_AUDIT_USER,
    });

    expect(deleted.map((archive) => archive.id)).toEqual(['expiree']);
  });

  it('ne supprime jamais une archive in-flight, même vieille et expirée', () => {
    const archives = [
      toArchive({
        id: 'pending-vieille',
        status: AuditPreuvesArchiveStatusEnum.PENDING,
        createdAt: dayOf(1),
        expiresAt: '2026-06-08T00:00:00.000Z',
      }),
      ...Array.from({ length: MAX_ARCHIVES_PER_AUDIT_USER }, (_, i) =>
        toArchive({ id: `a-${i}`, createdAt: dayOf(15 + i) })
      ),
    ];

    expect(
      selectArchivesToDelete(archives, {
        now,
        keepMostRecent: MAX_ARCHIVES_PER_AUDIT_USER,
      })
    ).toEqual([]);
  });

  it('compte les in-flight dans la limite de 10', () => {
    const inFlight = [
      toArchive({
        id: 'proc-1',
        status: AuditPreuvesArchiveStatusEnum.PROCESSING,
        createdAt: dayOf(29),
      }),
      toArchive({
        id: 'proc-2',
        status: AuditPreuvesArchiveStatusEnum.PROCESSING,
        createdAt: dayOf(28),
      }),
    ];
    const completed = Array.from({ length: 9 }, (_, i) =>
      toArchive({ id: `c-${i}`, createdAt: dayOf(i + 1) })
    );

    const deleted = selectArchivesToDelete([...inFlight, ...completed], {
      now,
      keepMostRecent: MAX_ARCHIVES_PER_AUDIT_USER,
    });

    expect(deleted.map((archive) => archive.id)).toEqual(['c-0']);
  });
});
