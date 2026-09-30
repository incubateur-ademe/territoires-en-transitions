import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Collectivite } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import {
  CollectiviteIdentityError,
  CollectiviteIdentityErrorEnum,
} from './score-mobilisation.errors';

export type CollectiviteIdentity = Pick<Collectivite, 'nom' | 'population'>;

@Injectable()
export class CollectiviteIdentityRepository {
  private readonly logger = new Logger(CollectiviteIdentityRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getCollectiviteIdentity({
    collectiviteId,
  }: {
    collectiviteId: number;
  }): Promise<Result<CollectiviteIdentity, CollectiviteIdentityError>> {
    try {
      const [identity] = await this.databaseService.db
        .select({
          nom: collectiviteTable.nom,
          population: collectiviteTable.population,
        })
        .from(collectiviteTable)
        .where(eq(collectiviteTable.id, collectiviteId));

      if (identity === undefined) {
        return failure(CollectiviteIdentityErrorEnum.COLLECTIVITE_NOT_FOUND);
      }
      return success(identity);
    } catch (error) {
      this.logger.error(
        `Could not read collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      const readError = error instanceof Error ? error : undefined;
      return failure(
        CollectiviteIdentityErrorEnum.GET_COLLECTIVITE_IDENTITY_ERROR,
        readError
      );
    }
  }
}
