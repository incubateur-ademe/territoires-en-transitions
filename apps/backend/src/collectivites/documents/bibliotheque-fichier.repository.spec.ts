import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { describe, expect, it } from 'vitest';
import { BibliothequeFichierRepository } from './bibliotheque-fichier.repository';

describe('BibliothequeFichierRepository', () => {
  it('renvoie DATABASE_ERROR au lieu de rejeter quand la lecture du fichier échoue', async () => {
    const databaseError = new Error('connection terminated unexpectedly');
    const failingDatabaseService = {
      db: {
        select: () => {
          throw databaseError;
        },
      },
    } as unknown as DatabaseService;
    const repository = new BibliothequeFichierRepository(
      failingDatabaseService
    );

    const result = await repository.isFichierOwnedByCollectivite({
      fichierId: 10,
      collectiviteId: 1,
    });

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.DATABASE_ERROR,
      cause: databaseError,
    });
  });
});
