import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { HandleDefinitionFichesRepository } from './handle-definition-fiches.repository';

describe('HandleDefinitionFichesRepository', () => {
  it('writes through the selected database without opening a transaction', async () => {
    const database = {
      transaction: vi.fn(),
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(() => ({})) })),
      })),
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    };
    const repository = new HandleDefinitionFichesRepository({
      db: database,
    } as unknown as DatabaseService);

    await repository.upsertIndicateurFiches({
      indicateurId: 1,
      collectiviteId: 2,
      ficheIds: [],
    });

    expect(database.delete).toHaveBeenCalledOnce();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
