import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DEMARCHE_PCAET_PUBLIC_STATUSES,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * La lecture publique des démarches PCAET : ce qu'en voit qui consulte la
 * collectivité sans en éditer les démarches.
 *
 * Indépendante des deux autres portes — l'édition (`demarches.pcaet.mutate`) et
 * l'instruction (`DepotPermissionsService`) —, qui gardent leurs règles et
 * l'accès à tous les statuts.
 */
@Injectable()
export class DemarchePcaetPublicAccessService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  /**
   * `PermissionService` ignore l'accès restreint : une collectivité privée
   * exige en plus la lecture confidentielle, que seuls ses membres détiennent.
   * Rend `isPrivate`, dont dépendent les lectures attenantes (plans).
   */
  async canReadCollectivite(
    collectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ isPrivate: boolean }, 'UNAUTHORIZED'>> {
    const readResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.READ'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!readResult.success) {
      return failure('UNAUTHORIZED');
    }

    const isPrivate = await this.collectivitesService.isPrivate(
      collectiviteId,
      tx
    );
    if (isPrivate) {
      const confidentielResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['COLLECTIVITES.READ_CONFIDENTIEL'],
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      );
      if (!confidentielResult.success) {
        return failure('UNAUTHORIZED');
      }
    }

    return success({ isPrivate });
  }

  /**
   * Tout refus répond comme une démarche absente — hors des statuts publics,
   * d'une autre collectivité, ou d'une collectivité qu'on ne peut pas lire : la
   * lecture publique n'a pas à révéler qu'un identifiant existe.
   */
  async canReadDemarche(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ isPrivate: boolean }, 'NOT_FOUND'>> {
    const [demarche] = await (tx ?? this.databaseService.db)
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          inArray(demarcheTable.status, [...DEMARCHE_PCAET_PUBLIC_STATUSES])
        )
      )
      .limit(1);
    if (!demarche) {
      return failure('NOT_FOUND');
    }

    const accessResult = await this.canReadCollectivite(collectiviteId, {
      user,
      tx,
    });
    if (!accessResult.success) {
      return failure('NOT_FOUND');
    }

    return accessResult;
  }
}
