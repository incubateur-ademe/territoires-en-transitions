import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { UpsertIndicateurThematiquesRepository } from './upsert-indicateur-thematiques.repository';

describe('UpsertIndicateurThematiquesRepository', () => {
  it('writes through the selected database without opening a transaction', async () => {
    const database = {
      transaction: vi.fn(),
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    };
    const repository = new UpsertIndicateurThematiquesRepository({
      db: database,
    } as unknown as DatabaseService);

    await repository.upsertIndicateurThematiques({
      indicateurId: 1,
      thematiqueIds: [],
    });

    expect(database.delete).toHaveBeenCalledOnce();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
