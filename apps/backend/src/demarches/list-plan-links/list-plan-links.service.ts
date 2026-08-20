import { Injectable, Logger } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  DEMARCHE_PCAET_ACTIVE_STATUSES,
  type DemarchePcaetStatus,
  type DemarcheType,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import {
  ListPlanLinksError,
  ListPlanLinksErrorEnum,
} from './list-plan-links.errors';
import { ListPlanLinksInput } from './list-plan-links.input';

export type DemarchePlanLink = {
  demarcheId: number;
  type: DemarcheType;
  titre: string;
  status: DemarchePcaetStatus;
  planActionId: number;
};

/**
 * Plans tenus par les démarches actives de la collectivité, tous types de
 * démarches confondus (la table `demarche` est partagée) : c'est la matière
 * de l'exclusivité plan ↔ démarche et du bandeau affiché sur un plan lié.
 */
@Injectable()
export class ListPlanLinksService {
  private readonly logger = new Logger(ListPlanLinksService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService
  ) {}

  async listPlanLinks(
    input: ListPlanLinksInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePlanLink[], ListPlanLinksError>> {
    // Seule permission du domaine demarches à ce jour : elle gate déjà les
    // deux consommateurs (page démarche et page plan en édition).
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(ListPlanLinksErrorEnum.UNAUTHORIZED);
    }

    try {
      const db = tx || this.databaseService.db;
      const rows = await db
        .select({
          demarcheId: demarcheTable.id,
          type: demarcheTable.type,
          titre: demarcheTable.titre,
          status: demarcheTable.status,
          planActionId: demarcheTable.planActionId,
        })
        .from(demarcheTable)
        .where(
          and(
            eq(demarcheTable.collectiviteId, input.collectiviteId),
            isNotNull(demarcheTable.planActionId),
            inArray(demarcheTable.status, [...DEMARCHE_PCAET_ACTIVE_STATUSES])
          )
        );

      return {
        success: true,
        data: rows.flatMap((row) =>
          row.planActionId === null
            ? []
            : [{ ...row, planActionId: row.planActionId }]
        ),
      };
    } catch (error) {
      this.logger.error(
        `Error listing plan links for collectivite ${input.collectiviteId}: ${error}`
      );
      return failure(ListPlanLinksErrorEnum.LIST_PLAN_LINKS_ERROR);
    }
  }
}
