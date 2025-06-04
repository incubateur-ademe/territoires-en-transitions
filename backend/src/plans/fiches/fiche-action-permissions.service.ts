import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthUser } from '../../users/models/auth.models';
import { Fiche, ficheActionTable } from './shared/models/fiche-action.table';

@Injectable()
export default class FicheActionPermissionsService {
  private readonly logger = new Logger(FicheActionPermissionsService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService
  ) {}

  /** Renvoi une fiche à partir de son id */
  async getFicheFromId(ficheId: number) {
    const rows = await this.databaseService.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    return rows?.[0] ?? null;
  }

  /** Détermine si un utilisateur peut lire une fiche */
  async canReadFiche(ficheId: number, tokenInfo: AuthUser): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (fiche === null) return false;
    return this.hasReadFichePermission(fiche, tokenInfo);
  }

  hasReadFichePermission(
    fiche: Pick<Fiche, 'collectiviteId' | 'restreint'>,
    tokenInfo: AuthUser,
    doNotThrow?: boolean
  ): Promise<boolean> {
    return this.permissionService.isAllowed(
      tokenInfo,
      fiche.restreint
        ? PermissionOperationEnum['PLANS.FICHES.LECTURE']
        : PermissionOperationEnum['PLANS.FICHES.VISITE'],
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId,
      doNotThrow
    );
  }

  /** Détermine si un utilisateur peut modifier une fiche */
  async canWriteFiche(ficheId: number, tokenInfo: AuthUser): Promise<boolean> {
    const fiche = await this.getFicheFromId(ficheId);
    if (fiche === null) return false;
    return await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['PLANS.FICHES.EDITION'],
      ResourceType.COLLECTIVITE,
      fiche.collectiviteId
    );
  }
}
