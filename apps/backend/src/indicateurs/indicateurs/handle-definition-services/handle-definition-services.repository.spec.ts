import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { HandleDefinitionServicesRepository } from './handle-definition-services.repository';

describe('HandleDefinitionServicesRepository', () => {
  it('writes through the selected database without opening a transaction', async () => {
    const database = {
      transaction: vi.fn(),
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    };
    const repository = new HandleDefinitionServicesRepository({
      db: database,
    } as unknown as DatabaseService);

    await repository.upsertIndicateurServices({
      indicateurId: 1,
      collectiviteId: 2,
      serviceIds: [],
    });

    expect(database.delete).toHaveBeenCalledOnce();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
