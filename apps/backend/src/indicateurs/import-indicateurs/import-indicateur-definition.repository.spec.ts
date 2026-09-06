import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ImportIndicateurDefinitionRepository } from './import-indicateur-definition.repository';

describe('ImportIndicateurDefinitionRepository', () => {
  it('short-circuits the value lookup when no definition is in scope', async () => {
    const select = vi.fn();
    const repository = new ImportIndicateurDefinitionRepository({
      db: { select },
    } as unknown as DatabaseService);

    await expect(
      repository.findFirstIndicateurIdWithValeur([])
    ).resolves.toBeNull();
    expect(select).not.toHaveBeenCalled();
  });
});
