import { Injectable, Logger } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { ActionId } from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { PermissionService } from '../../users/authorizations/permission.service';
import { DatabaseService } from '../../utils/database/database.service';
import { actionServiceTable } from '../models/action-service.table';
import {
  HandleMesureServicesError,
  HandleMesureServicesErrorEnum,
} from './handle-mesure-services.errors';

@Injectable()
export class HandleMesureServicesService {
  private readonly logger = new Logger(HandleMesureServicesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly referentielModeGuard: ReferentielModeGuard
  ) {}

  async listServices(
    collectiviteId: number,
    mesureIds?: ActionId[],
    tx?: Transaction
  ): Promise<Record<ActionId, TagWithCollectiviteId[]>> {
    this.logger.log(this.formatServicesLog(collectiviteId, mesureIds));

    const db = tx || this.databaseService.db;

    const conditions = [eq(actionServiceTable.collectiviteId, collectiviteId)];
    if (mesureIds && mesureIds.length > 0) {
      conditions.push(inArray(actionServiceTable.actionId, mesureIds));
    }

    const services = await db
      .select({
        collectiviteId: actionServiceTable.collectiviteId,
        actionId: actionServiceTable.actionId,
        id: actionServiceTable.serviceTagId,
        nom: serviceTagTable.nom,
      })
      .from(actionServiceTable)
      .innerJoin(
        serviceTagTable,
        eq(serviceTagTable.id, actionServiceTable.serviceTagId)
      )
      .where(and(...conditions));

    const servicesByMesureId: Record<ActionId, TagWithCollectiviteId[]> = {};
    for (const service of services) {
      if (!servicesByMesureId[service.actionId]) {
        servicesByMesureId[service.actionId] = [];
      }
      servicesByMesureId[service.actionId].push({
        id: service.id,
        nom: service.nom,
        collectiviteId: service.collectiviteId,
      });
    }

    return servicesByMesureId;
  }

  async upsertServices(
    collectiviteId: number,
    mesureId: ActionId,
    services: { serviceTagId: number }[],
    tokenInfo: AuthUser
  ): Promise<
    Result<Record<ActionId, TagWithCollectiviteId[]>, HandleMesureServicesError>
  > {
    const isAllowed = await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure('UNAUTHORIZED');
    }

    const modeResult = await this.referentielModeGuard.assertCanMutateAction(
      collectiviteId,
      mesureId
    );
    if (!modeResult.success) {
      return modeResult;
    }

    if (services.length === 0) {
      return failure(HandleMesureServicesErrorEnum.EMPTY_SERVICES_LIST);
    }

    this.logger.log(
      `Mise à jour des services pour la collectivité ${collectiviteId} et la mesure ${mesureId}`
    );

    try {
      const result = await this.databaseService.db.transaction(async (tx) => {
        await tx
          .delete(actionServiceTable)
          .where(
            and(
              eq(actionServiceTable.collectiviteId, collectiviteId),
              eq(actionServiceTable.actionId, mesureId)
            )
          );

        await tx.insert(actionServiceTable).values(
          services.map((service) => ({
            collectiviteId,
            actionId: mesureId,
            serviceTagId: service.serviceTagId,
          }))
        );

        return await this.listServices(collectiviteId, [mesureId], tx);
      });

      return success(result);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async deleteServices(
    collectiviteId: number,
    mesureId: ActionId,
    tokenInfo: AuthUser
  ): Promise<Result<void, HandleMesureServicesError>> {
    const isAllowed = await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure('UNAUTHORIZED');
    }

    const modeResult = await this.referentielModeGuard.assertCanMutateAction(
      collectiviteId,
      mesureId
    );
    if (!modeResult.success) {
      return modeResult;
    }

    this.logger.log(
      `Suppression des services pour la collectivité ${collectiviteId} et la mesure ${mesureId}`
    );

    try {
      await this.databaseService.db
        .delete(actionServiceTable)
        .where(
          and(
            eq(actionServiceTable.collectiviteId, collectiviteId),
            eq(actionServiceTable.actionId, mesureId)
          )
        );

      return success(undefined);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private formatServicesLog(
    collectiviteId: number,
    mesureIds?: ActionId[]
  ): string {
    if (!mesureIds || mesureIds.length === 0) {
      return `Récupération de tous les services pour la collectivité ${collectiviteId}`;
    }
    const nbMesures = mesureIds.length;
    if (nbMesures > 10) {
      return `Récupération des services pour la collectivité ${collectiviteId} (${nbMesures} mesures)`;
    }
    return `Récupération des services pour la collectivité ${collectiviteId} (${nbMesures} mesure(s): ${mesureIds.join(
      ', '
    )})`;
  }
}
