import { ListCollectiviteApiResponse } from '@/backend/collectivites/list-collectivites/list-collectivites.api-response';
import { ListCollectiviteInput } from '@/backend/collectivites/list-collectivites/list-collectivites.input';
import { CollectiviteNatureType } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import {
  collectiviteTable,
  CollectiviteType,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  SQL,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { omit } from 'es-toolkit';
import { DatabaseService } from '../../utils/database/database.service';
import { ListCollectivitesFieldsMode } from './list-collectivites-fields-mode.enum';

@Injectable()
export default class ListCollectivitesService {
  private readonly logger = new Logger(ListCollectivitesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Récupère les catégories possibles pour une collectivité
   * @param collectiviteId
   * @param withPredefinedTags vrai pour inclure les tags prédéfinis par TeT
   * @param tokenInfo
   */
  async listCollectivites(
    input: ListCollectiviteInput,
    fieldsMode: ListCollectivitesFieldsMode = 'resume'
  ): Promise<ListCollectiviteApiResponse> {
    const db = this.db.db;

    const request = db
      .select(
        fieldsMode === 'resume'
          ? {
              id: collectiviteTable.id,
              nom: collectiviteTable.nom,
              siren: collectiviteTable.siren,
              natureInsee: sql<CollectiviteNatureType>`${collectiviteTable.natureInsee}`,
            }
          : omit(
              {
                ...getTableColumns(collectiviteTable),
                createdAt: getISOFormatDateQuery(collectiviteTable.createdAt),
                modifiedAt: getISOFormatDateQuery(collectiviteTable.modifiedAt),
                type: sql<CollectiviteType>`${collectiviteTable.type}`,
                natureInsee: sql<CollectiviteNatureType>`${collectiviteTable.natureInsee}`,
              },
              ['accessRestreint']
            )
      )
      .from(collectiviteTable);

    const whereConditions: (SQLWrapper | SQL)[] = [];

    if (input?.collectiviteId) {
      whereConditions.push(eq(collectiviteTable.id, input.collectiviteId));
    }

    if (input?.type) {
      whereConditions.push(eq(collectiviteTable.type, input.type));
    }

    if (input?.natureInsee) {
      whereConditions.push(
        eq(collectiviteTable.natureInsee, input.natureInsee)
      );
    }

    if (input?.siren) {
      whereConditions.push(eq(collectiviteTable.siren, input.siren));
    }

    if (input?.communeCode) {
      whereConditions.push(
        eq(collectiviteTable.communeCode, input.communeCode)
      );
    }

    if (input?.text) {
      whereConditions.push(
        sql`unaccent
          (${collectiviteTable.nom})
          ILIKE unaccent(
          ${'%' + input.text + '%'}
          )`
      );
    }

    if (whereConditions.length > 0) {
      request.where(and(...whereConditions));
    }

    return this.db.withPagination(
      request.$dynamic(),
      input.text
        ? desc(sql`similarity
      (${collectiviteTable.nom}, ${input.text})`)
        : asc(collectiviteTable.nom),
      input.page,
      input.limit
    );
  }
}
