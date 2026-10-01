import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { describe, expect, it, vi } from 'vitest';
import { PermissionRepository } from './permission.repository';

function createSelectQuery(
  rows: Array<{ collectiviteId: number; referentielId: string }>
) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return { select, from, where, limit };
}

describe('PermissionRepository', () => {
  it('loads the referentiel context of an audit', async () => {
    const query = createSelectQuery([
      { collectiviteId: 12, referentielId: 'cae' },
    ]);
    const repository = new PermissionRepository({
      db: { select: query.select },
    } as unknown as DatabaseService);

    await expect(repository.getAuditPermissionContext(42)).resolves.toEqual({
      collectiviteId: 12,
      referentielId: 'cae',
    });
    expect(query.where).toHaveBeenCalledOnce();
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('returns null when the audit does not exist', async () => {
    const query = createSelectQuery([]);
    const repository = new PermissionRepository({
      db: { select: query.select },
    } as unknown as DatabaseService);

    await expect(repository.getAuditPermissionContext(404)).resolves.toBeNull();
  });

  it('uses the transaction supplied by the application service', async () => {
    const databaseSelect = vi.fn();
    const transactionQuery = createSelectQuery([
      { collectiviteId: 12, referentielId: 'eci' },
    ]);
    const repository = new PermissionRepository({
      db: { select: databaseSelect },
    } as unknown as DatabaseService);
    const tx = {
      select: transactionQuery.select,
    } as unknown as Transaction;

    await expect(repository.getAuditPermissionContext(42, tx)).resolves.toEqual(
      {
        collectiviteId: 12,
        referentielId: 'eci',
      }
    );
    expect(transactionQuery.select).toHaveBeenCalledOnce();
    expect(databaseSelect).not.toHaveBeenCalled();
  });
});
