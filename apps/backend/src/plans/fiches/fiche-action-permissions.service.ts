import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FicheAccessMode,
  FicheAccessModeEnum,
} from '@tet/backend/plans/fiches/share-fiches/fiche-access-mode.enum';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Fiche, FicheWithRelations } from '@tet/domain/plans';
import {
  hasPermission,
  type PermissionOperation,
  PermissionOperationEnum,
  ResourceType,
} from '@tet/domain/users';
import { and, eq, getTableColumns, isNotNull, sql } from 'drizzle-orm';
import { GetUserRolesAndPermissionsService } from '../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { AuthenticatedUser, AuthUser } from '../../users/models/auth.models';
import { ficheActionPiloteTable } from './shared/models/fiche-action-pilote.table';
import { ficheActionTable } from './shared/models/fiche-action.table';

@Injectable()
export default class FicheActionPermissionsService {
  private readonly logger = new Logger(FicheActionPermissionsService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly databaseService: DatabaseService,
    private readonly shareFicheService: ShareFicheService
  ) {}

  /** Renvoi une fiche à partir de son id */
  async getFicheFromId(ficheId: number) {
    const rows = await this.databaseService.db
      .select({
        ...getTableColumns(ficheActionTable),
      })
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    return rows?.[0] ?? null;
  }

  async getPiloteUserIdsForFiche(ficheId: number): Promise<string[]> {
    const rows = await this.databaseService.db
      .select({
        userId: sql<string>`${ficheActionPiloteTable.userId}`,
      })
      .from(ficheActionPiloteTable)
      .where(
        and(
          eq(ficheActionPiloteTable.ficheId, ficheId),
          isNotNull(ficheActionPiloteTable.userId)
        )
      );
    return rows.map((row) => row.userId);
  }

  async isAllowedByFicheSharings(
    fiche: Pick<
      FicheWithRelations,
      'id' | 'collectiviteId' | 'sharedWithCollectivites'
    >,
    operation: PermissionOperation,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<FicheAccessMode | null> {
    if (
      fiche.sharedWithCollectivites &&
      fiche.sharedWithCollectivites?.length > 0
    ) {
      this.logger.log(
        `Fiche ${fiche.id} partagée avec ${fiche.sharedWithCollectivites.length} collectivités, vérification des accès pour ces collectivités`
      );

      // TODO: optimize by  querying all collectivites access in one query
      const isAllowedPromises = fiche.sharedWithCollectivites.map((sharing) =>
        this.permissionService.isAllowed(
          tokenInfo,
          operation,
          ResourceType.COLLECTIVITE,
          sharing.id,
          true
        )
      );
      const isAllowedResults = await Promise.all(isAllowedPromises);
      const isAllowed = isAllowedResults.some((allowed) => allowed);
      if (isAllowed) {
        return FicheAccessModeEnum.SHARED;
      }
    }

    if (doNotThrow) {
      return null;
    } else {
      throw new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${tokenInfo.id} n'a pas l'autorisation ${operation} sur la ressource Collectivité ${fiche.collectiviteId}`
      );
    }
  }

  private async isAllowedByFicheIdSharings(
    fiche: Pick<Fiche, 'id' | 'collectiviteId'>,
    operation: PermissionOperation,
    tokenInfo: AuthUser
  ): Promise<FicheAccessMode | null> {
    const sharings = await this.shareFicheService.listFicheSharings(fiche.id);

    const ficheWithSharings: Pick<
      FicheWithRelations,
      'id' | 'collectiviteId' | 'sharedWithCollectivites'
    > = {
      ...fiche,
      sharedWithCollectivites: sharings.map((sharing) => ({
        id: sharing.collectiviteId,
        nom: '', // Not needed
      })),
    };

    return this.isAllowedByFicheSharings(
      ficheWithSharings,
      operation,
      tokenInfo
    );
  }

  async canReadFicheObject(
    fiche: FicheWithRelations,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<FicheAccessMode | null> {
    // Check direct permissions first
    const operation = this.getReadFichePermission(fiche);
    const hasDirectPermission = await this.hasReadFichePermission(
      fiche,
      tokenInfo,
      true
    );
    if (hasDirectPermission) {
      return FicheAccessModeEnum.DIRECT;
    }

    return this.isAllowedByFicheSharings(
      fiche,
      operation,
      tokenInfo,
      doNotThrow
    );
  }

  /** Détermine si un utilisateur peut lire une fiche */
  async canReadFiche(
    ficheId: number,
    tokenInfo: AuthUser
  ): Promise<FicheAccessMode | null> {
    const fiche = await this.getFicheFromId(ficheId);
    if (!fiche) {
      throw new NotFoundException(`Action non trouvée pour l'id ${ficheId}`);
    }

    // Check direct permissions first
    const operation = this.getReadFichePermission(fiche);
    const hasDirectPermission = await this.hasReadFichePermission(
      fiche,
      tokenInfo,
      true
    );
    if (hasDirectPermission) {
      return FicheAccessModeEnum.DIRECT;
    }

    return this.isAllowedByFicheIdSharings(fiche, operation, tokenInfo);
  }

  getReadFichePermission(fiche: Pick<Fiche, 'restreint'>): PermissionOperation {
    return fiche.restreint
      ? 'plans.fiches.read_confidentiel'
      : 'plans.fiches.read';
  }

  hasReadFichePermission(
    fiche: Pick<Fiche, 'collectiviteId' | 'restreint'>,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<boolean> {
    return this.permissionService.isAllowed(
      tokenInfo,
      this.getReadFichePermission(fiche),
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId,
      doNotThrow
    );
  }

  async canDeleteFiche(
    ficheId: number,
    user: AuthUser,
    doNotThrow?: boolean
  ): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (!fiche) {
      throw new NotFoundException(`Action non trouvée pour l'id ${ficheId}`);
    }

    // Check direct permissions first
    const operation = PermissionOperationEnum['PLANS.FICHES.DELETE'];
    return await this.permissionService.isAllowed(
      user,
      operation,
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId,
      doNotThrow
    );
  }

  /** Détermine si un utilisateur peut modifier une fiche */
  async canWriteFiche(
    ficheId: number,
    user: AuthenticatedUser
  ): Promise<FicheAccessMode | null> {
    const fiche = await this.getFicheFromId(ficheId);
    if (!fiche) {
      throw new NotFoundException(`Action non trouvée pour l'id ${ficheId}`);
    }

    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
      });

    if (!userPermissionsResult.success) {
      throw new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas les droits pour modifier la fiche ${ficheId}`
      );
    }

    const userPermissions = userPermissionsResult.data;

    if (
      hasPermission(userPermissions, 'plans.fiches.update', {
        collectiviteId: fiche.collectiviteId,
      })
    ) {
      return FicheAccessModeEnum.DIRECT;
    }

    if (
      hasPermission(userPermissions, 'plans.fiches.update_piloted_by_me', {
        collectiviteId: fiche.collectiviteId,
      })
    ) {
      const piloteUserIds = await this.getPiloteUserIdsForFiche(ficheId);
      if (piloteUserIds.includes(user.id)) {
        return FicheAccessModeEnum.DIRECT;
      }
    }

    return this.isAllowedByFicheIdSharings(fiche, 'plans.fiches.update', user);
  }
}
