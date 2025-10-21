import { FicheWithRelations } from '@/backend/plans/fiches/list-fiches/fiche-action-with-relations.dto';
import {
  FicheAccessMode,
  FicheAccessModeEnum,
} from '@/backend/plans/fiches/share-fiches/fiche-access-mode.enum';
import { ShareFicheService } from '@/backend/plans/fiches/share-fiches/share-fiche.service';
import {
  type PermissionOperation,
  PermissionOperationEnum,
} from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthUser } from '../../users/models/auth.models';
import { Fiche, ficheActionTable } from './shared/models/fiche-action.table';

@Injectable()
export default class FicheActionPermissionsService {
  private readonly logger = new Logger(FicheActionPermissionsService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly shareFicheService: ShareFicheService
  ) {}

  /** Renvoi une fiche à partir de son id */
  async getFicheFromId(ficheId: number) {
    const rows = await this.databaseService.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    return rows?.[0] ?? null;
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
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<FicheAccessMode | null> {
    const sharings = await this.shareFicheService.getFicheActionSharing(
      fiche.id
    );

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
      tokenInfo,
      doNotThrow
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
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<FicheAccessMode | null> {
    const fiche = await this.getFicheFromId(ficheId);
    if (!fiche) {
      throw new NotFoundException(
        `Fiche action non trouvée pour l'id ${ficheId}`
      );
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

    return this.isAllowedByFicheIdSharings(
      fiche,
      operation,
      tokenInfo,
      doNotThrow
    );
  }

  getReadFichePermission(fiche: Pick<Fiche, 'restreint'>): PermissionOperation {
    return fiche.restreint
      ? PermissionOperationEnum['PLANS.FICHES.LECTURE']
      : PermissionOperationEnum['PLANS.FICHES.VISITE'];
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

  /** Détermine si un utilisateur peut modifier une fiche */
  async canWriteFiche(
    ficheId: number,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<FicheAccessMode | null> {
    const fiche = await this.getFicheFromId(ficheId);
    if (!fiche) {
      throw new NotFoundException(
        `Fiche action non trouvée pour l'id ${ficheId}`
      );
    }

    // Check direct permissions first
    const operation = PermissionOperationEnum['PLANS.FICHES.EDITION'];
    const hasDirectPermission = await this.permissionService.isAllowed(
      tokenInfo,
      operation,
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId,
      true
    );
    if (hasDirectPermission) {
      return FicheAccessModeEnum.DIRECT;
    }

    return this.isAllowedByFicheIdSharings(
      fiche,
      operation,
      tokenInfo,
      doNotThrow
    );
  }
}
