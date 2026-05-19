import { Injectable, Logger } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { ResourceType } from '@tet/domain/users';
import { and, asc, eq, inArray, isNull, or, SQL, sql } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { storageObjectTable } from '../models/storage-object.table';
import type { ListDocumentsInput } from './list-documents.input';
import type { ListDocumentsOutput } from './list-documents.output';

@Injectable()
export class ListDocumentsService {
  private readonly logger = new Logger(ListDocumentsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listDocuments(
    input: ListDocumentsInput,
    user: AuthenticatedUser
  ): Promise<Result<ListDocumentsOutput, CommonError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.read',
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const canReadConfidentiel = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.read_confidentiel',
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true
    );

    const conditions: (SQL | undefined)[] = [
      eq(bibliothequeFichierTable.collectiviteId, input.collectiviteId),
    ];
    const filenameContains = input.filenameContains?.trim();
    if (filenameContains) {
      conditions.push(
        sql`unaccent(${
          bibliothequeFichierTable.filename
        }) ilike unaccent(${`%${filenameContains}%`})`
      );
    }
    if (input.hashes?.length) {
      conditions.push(inArray(bibliothequeFichierTable.hash, input.hashes));
    }
    if (!canReadConfidentiel) {
      conditions.push(
        or(
          isNull(bibliothequeFichierTable.confidentiel),
          eq(bibliothequeFichierTable.confidentiel, false)
        )
      );
    }

    try {
      const qb = this.databaseService.db
        .select({
          id: bibliothequeFichierTable.id,
          collectiviteId: bibliothequeFichierTable.collectiviteId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          confidentiel: bibliothequeFichierTable.confidentiel,
          bucketId: collectiviteBucketTable.bucketId,
          fileId: storageObjectTable.id,
          filesize: sql<
            number | null
          >`floor((${storageObjectTable.metadata}->>'size')::numeric)::integer`.as(
            'filesize'
          ),
        })
        .from(bibliothequeFichierTable)
        .innerJoin(
          collectiviteBucketTable,
          eq(
            collectiviteBucketTable.collectiviteId,
            bibliothequeFichierTable.collectiviteId
          )
        )
        .innerJoin(
          storageObjectTable,
          and(
            eq(storageObjectTable.name, bibliothequeFichierTable.hash),
            eq(storageObjectTable.bucketId, collectiviteBucketTable.bucketId)
          )
        )
        .where(and(...conditions))
        .$dynamic();

      const page = await this.databaseService.withPagination(
        qb,
        sql`${asc(bibliothequeFichierTable.filename)}, ${asc(
          bibliothequeFichierTable.id
        )}`,
        input.page,
        input.limit
      );

      this.logger.log(
        `${page.data.length} documents listés pour la collectivité ${input.collectiviteId} (${page.count} au total)`
      );

      return success(page as ListDocumentsOutput);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des documents pour la collectivité ${input.collectiviteId}`,
        error
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
