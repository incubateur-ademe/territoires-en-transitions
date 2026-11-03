import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { UpsertIndicateurFichesRepository } from './upsert-indicateur-fiches.repository';

describe('UpsertIndicateurFichesRepository', () => {
  it('writes through the selected database without opening a transaction', async () => {
    const database = {
      transaction: vi.fn(),
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(() => ({})) })),
      })),
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    };
    const repository = new UpsertIndicateurFichesRepository({
      db: database,
    } as unknown as DatabaseService);

    await repository.upsertIndicateurFiches({
      indicateurId: 1,
      collectiviteId: 2,
      ficheIds: [],
      ficheIdsToUnlink: [3],
      createdBy: 'user-id',
    });

    expect(database.delete).toHaveBeenCalledOnce();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
