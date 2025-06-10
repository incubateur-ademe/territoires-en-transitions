import {
  PermissionOperationEnum,
  PermissionOperationType,
} from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { ShareFicheActionService } from '@/backend/plans/fiches/share-fiches/share-fiche-action.service';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthUser } from '../../auth/models/auth.models';
import { Fiche, ficheActionTable } from './shared/models/fiche-action.table';

@Injectable()
export default class FicheActionPermissionsService {
  private readonly logger = new Logger(FicheActionPermissionsService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly shareFicheActionService: ShareFicheActionService
  ) {}

  /** Renvoi une fiche à partir de son id */
  async getFicheFromId(ficheId: number) {
    const rows = await this.databaseService.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    return rows?.[0] ?? null;
  }

  private async isAllowedBySharings(
    fiche: Pick<Fiche, 'id' | 'collectiviteId'>,
    operation: PermissionOperationType,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ) {
    const sharings = await this.shareFicheActionService.getFicheActionSharing(
      fiche.id
    );

    if (sharings.length > 0) {
      console.log('sharings', sharings);
      const isAllowedPromises = sharings.map((sharing) =>
        this.permissionService.isAllowed(
          tokenInfo,
          operation,
          ResourceType.COLLECTIVITE,
          sharing.collectiviteId,
          true
        )
      );
      const isAllowedResults = await Promise.all(isAllowedPromises);
      const isAllowed = isAllowedResults.some((allowed) => allowed);
      if (isAllowed) {
        console.log('is allowed by sharings');
        return true;
      }
    } else {
      console.log('no sharings');
    }

    if (doNotThrow) {
      return false;
    } else {
      throw new UnauthorizedException(
        `Droits insuffisants, l'utilisateur ${tokenInfo.id} n'a pas l'autorisation ${operation} sur la ressource Collectivité ${fiche.collectiviteId}`
      );
    }
  }

  /** Détermine si un utilisateur peut lire une fiche */
  async canReadFiche(
    ficheId: number,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (fiche === null) return false;

    // Check direct permissions first
    const operation = this.getReadFichePermission(fiche);
    const hasDirectPermission = await this.hasReadFichePermission(
      fiche,
      tokenInfo,
      true
    );
    if (hasDirectPermission) {
      return true;
    }

    return this.isAllowedBySharings(fiche, operation, tokenInfo, doNotThrow);
  }

  getReadFichePermission(
    fiche: Pick<Fiche, 'restreint'>
  ): PermissionOperationType {
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
  ): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (fiche === null) return false;

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
      return true;
    }

    return this.isAllowedBySharings(fiche, operation, tokenInfo, doNotThrow);
  }
}
