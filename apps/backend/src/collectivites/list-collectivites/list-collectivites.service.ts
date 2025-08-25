import { ListCollectiviteApiResponse } from '@/backend/collectivites/list-collectivites/list-collectivites.api-response';
import { ListCollectiviteInput } from '@/backend/collectivites/list-collectivites/list-collectivites.input';
import { CollectiviteNatureType } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteRelationsTable } from '@/backend/collectivites/shared/models/collectivite-relations.table';
import {
  CollectivitePublic,
  CollectiviteResume,
  collectiviteTable,
  CollectiviteType,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  aliasedTable,
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

/**
 * Minimum population for a commune to be imported in the platform
 */
export const MIN_COMMUNE_POPULATION = 3000;

@Injectable()
export default class ListCollectivitesService {
  private readonly logger = new Logger(ListCollectivitesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  private getCollectiviteParentsQuery() {
    const parentCollectivite = aliasedTable(
      collectiviteTable,
      'collectiviteParents'
    );

    return this.db.db
      .select({
        collectiviteId: collectiviteRelationsTable.id,
        parentIds: sql<
          string[]
        >`array_agg(${collectiviteRelationsTable.parentId})`.as('parent_ids'),
        parents: sql<
          CollectiviteResume[]
        >`array_agg(json_build_object('id', ${collectiviteRelationsTable.parentId}, 'nom', ${parentCollectivite.nom}, 'siren', ${parentCollectivite.siren}, 'natureInsee', ${parentCollectivite.natureInsee}, 'type', ${parentCollectivite.type} ) ORDER BY ${parentCollectivite.nom} ASC)`.as(
          'parents'
        ),
      })
      .from(collectiviteRelationsTable)
      .leftJoin(
        parentCollectivite,
        eq(parentCollectivite.id, collectiviteRelationsTable.parentId)
      )
      .groupBy(collectiviteRelationsTable.id)
      .as('collectiviteParents');
  }

  private getCollectiviteEnfantsQuery() {
    const enfantsCollectivite = aliasedTable(
      collectiviteTable,
      'collectiviteEnfants'
    );

    return this.db.db
      .select({
        collectiviteId: collectiviteRelationsTable.parentId,
        enfantIds: sql<
          string[]
        >`array_agg(${collectiviteRelationsTable.id})`.as('enfant_ids'),
        enfants: sql<
          CollectiviteResume[]
        >`array_agg(json_build_object('id', ${collectiviteRelationsTable.id}, 'nom', ${enfantsCollectivite.nom}, 'siren', ${enfantsCollectivite.siren}, 'communeCode', ${enfantsCollectivite.communeCode}, 'natureInsee', ${enfantsCollectivite.natureInsee}, 'type', ${enfantsCollectivite.type} )  ORDER BY ${enfantsCollectivite.nom} ASC)`.as(
          'enfants'
        ),
      })
      .from(collectiviteRelationsTable)
      .leftJoin(
        enfantsCollectivite,
        eq(enfantsCollectivite.id, collectiviteRelationsTable.id)
      )
      .groupBy(collectiviteRelationsTable.parentId)
      .as('collectiviteEnfants');
  }

  async getCollectiviteByAnyIdentifiant(input: {
    collectiviteId?: number;
    siren?: string;
    communeCode?: string;
  }) {
    if (!input.collectiviteId && !input.siren && !input.communeCode) {
      throw new BadRequestException(
        'collectiviteId or siren or communeCode is required'
      );
    }

    const collectivites = await this.listCollectivites({
      ...input,
      fieldsMode: 'public',
      withRelations: true,
      page: 1,
      limit: 1,
    });
    if (!collectivites.data.length) {
      throw new NotFoundException(
        `Collectivité avec l'identifiant ${
          input.collectiviteId || input.siren || input.communeCode
        } introuvable`
      );
    }
    return collectivites.data[0] as CollectivitePublic;
  }

  async listCollectivites(
    input: ListCollectiviteInput
  ): Promise<ListCollectiviteApiResponse> {
    const db = this.db.db;

    const collectiviteParents = this.getCollectiviteParentsQuery();
    const collectiviteEnfants = this.getCollectiviteEnfantsQuery();

    const relationsFields = input.withRelations
      ? {
          parents: collectiviteParents.parents,
          enfants: collectiviteEnfants.enfants,
        }
      : ({} as {
          parents: SQL.Aliased<CollectiviteResume[]>;
          enfants: SQL.Aliased<CollectiviteResume[]>;
        });

    const fields =
      !input.fieldsMode || input.fieldsMode === 'resume'
        ? {
            id: collectiviteTable.id,
            nom: collectiviteTable.nom,
            siren: collectiviteTable.siren,
            communeCode: collectiviteTable.communeCode,
            natureInsee: sql<CollectiviteNatureType>`${collectiviteTable.natureInsee}`,
            type: sql<CollectiviteType>`${collectiviteTable.type}`,
            ...relationsFields,
          }
        : omit(
            {
              ...getTableColumns(collectiviteTable),
              createdAt: getISOFormatDateQuery(collectiviteTable.createdAt),
              modifiedAt: getISOFormatDateQuery(collectiviteTable.modifiedAt),
              type: sql<CollectiviteType>`${collectiviteTable.type}`,
              natureInsee: sql<CollectiviteNatureType>`${collectiviteTable.natureInsee}`,
              ...relationsFields,
            },
            ['accessRestreint']
          );

    const request = input.withRelations
      ? db
          .select(fields)
          .from(collectiviteTable)
          .leftJoin(
            collectiviteParents,
            eq(collectiviteTable.id, collectiviteParents.collectiviteId)
          )
          .leftJoin(
            collectiviteEnfants,
            eq(collectiviteTable.id, collectiviteEnfants.collectiviteId)
          )
      : db.select(fields).from(collectiviteTable);

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
