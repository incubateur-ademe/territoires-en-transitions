import { Injectable } from '@nestjs/common';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ResourceType } from '@tet/domain/users';
import { and, Column, count, eq, like, or, SQL } from 'drizzle-orm';
import { CountPreuvesInput } from './count-preuves.input';
import { CountPreuvesOutput } from './count-preuves.output';

@Injectable()
export class CountPreuvesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  private readonly db = this.databaseService.db;

  async countPreuves(
    input: CountPreuvesInput,
    user: AuthenticatedUser
  ): Promise<CountPreuvesOutput> {
    const { collectiviteId, actionId } = input;

    const collectivitePrivate = await this.collectivitesService.isPrivate(
      collectiviteId
    );

    await this.permissions.isAllowed(
      user,
      collectivitePrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const actionScope = this.matchesActionOrDescendant(
      actionId,
      preuveActionTable.actionId
    );

    const complementaireScope = this.matchesActionOrDescendant(
      actionId,
      preuveComplementaireTable.actionId
    );

    const [reglementaireRows, complementaireRows] = await Promise.all([
      this.queryPreuvesReglementairesCount(collectiviteId, actionScope),
      this.queryPreuvesComplementairesCount(
        collectiviteId,
        complementaireScope
      ),
    ]);

    const countByActionId = new Map<string, number>();
    const setCountByActionId = (row: { actionId: string; count: number }) => {
      const n = Number(row.count);
      countByActionId.set(
        row.actionId,
        (countByActionId.get(row.actionId) ?? 0) + n
      );
    };
    for (const row of reglementaireRows) {
      setCountByActionId(row);
    }
    for (const row of complementaireRows) {
      setCountByActionId(row);
    }

    const actionIds = [...countByActionId.keys()];
    const children = actionIds
      .map((actionIdKey) => {
        const directCount = countByActionId.get(actionIdKey) ?? 0;
        const descendantsSum = actionIds
          .filter((id) => id.startsWith(`${actionIdKey}.`))
          .reduce((sum, id) => sum + (countByActionId.get(id) ?? 0), 0);
        return {
          actionId: actionIdKey,
          count: directCount,
          total: directCount + descendantsSum,
        };
      })
      .sort((a, b) =>
        a.actionId.localeCompare(b.actionId, undefined, { numeric: true })
      );

    const total = children.reduce((sum, row) => sum + row.count, 0);

    return { total, children };
  }

  private queryPreuvesReglementairesCount(
    collectiviteId: number,
    actionScope: SQL | undefined
  ) {
    return this.db
      .select({
        actionId: preuveActionTable.actionId,
        count: count().as('count'),
      })
      .from(preuveReglementaireTable)
      .innerJoin(
        preuveActionTable,
        eq(preuveReglementaireTable.preuveId, preuveActionTable.preuveId)
      )
      .where(
        and(
          eq(preuveReglementaireTable.collectiviteId, collectiviteId),
          actionScope
        )
      )
      .groupBy(preuveActionTable.actionId);
  }

  private queryPreuvesComplementairesCount(
    collectiviteId: number,
    complementaireScope: SQL | undefined
  ) {
    return this.db
      .select({
        actionId: preuveComplementaireTable.actionId,
        count: count().as('count'),
      })
      .from(preuveComplementaireTable)
      .where(
        and(
          eq(preuveComplementaireTable.collectiviteId, collectiviteId),
          complementaireScope
        )
      )
      .groupBy(preuveComplementaireTable.actionId);
  }

  private matchesActionOrDescendant(
    actionId: string,
    column: Column
  ): SQL | undefined {
    const escapedActionId = actionId.replace(/[\\%_]/g, '\\$&');
    return or(eq(column, actionId), like(column, `${escapedActionId}.%`));
  }
}
