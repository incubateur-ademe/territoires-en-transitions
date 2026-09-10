import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { escapeLikePattern } from '@tet/backend/utils/database/like-pattern.utils';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, eq, ilike } from 'drizzle-orm';
import { buildFichierSubquery } from '../file-info.utils';
import { hideConfidentielFilter } from '../hide-confidentiel.utils';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { ListBibliothequeDocumentsInput } from './list-bibliotheque-documents.input';

export type BibliothequeDocument = Pick<
  typeof bibliothequeFichierTable.$inferSelect,
  'id' | 'filename' | 'confidentiel'
>;

@Injectable()
export class ListBibliothequeDocumentsRepository {
  private readonly logger = new Logger(
    ListBibliothequeDocumentsRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listBibliothequeDocuments(
    {
      collectiviteId,
      search,
      limit,
      canReadConfidentiel,
    }: ListBibliothequeDocumentsInput & { canReadConfidentiel: boolean },
    tx?: Transaction
  ): Promise<Result<BibliothequeDocument[], 'DATABASE_ERROR'>> {
    const db = tx ?? this.databaseService.db;
    const fichier = buildFichierSubquery(db);
    const hasSearchTerm = search !== undefined && search !== '';
    const filenameFilter = hasSearchTerm
      ? ilike(fichier.filename, `%${escapeLikePattern(search)}%`)
      : undefined;

    try {
      const documents = await db
        .select({
          id: fichier.id,
          filename: fichier.filename,
          confidentiel: fichier.confidentiel,
        })
        .from(fichier)
        .where(
          and(
            eq(fichier.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: fichier.id,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            }),
            filenameFilter
          )
        )
        .orderBy(asc(fichier.filename), asc(fichier.id))
        .limit(limit);

      return success(documents);
    } catch (error) {
      this.logger.error(
        `Échec de la lecture de la bibliothèque de la collectivité ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
