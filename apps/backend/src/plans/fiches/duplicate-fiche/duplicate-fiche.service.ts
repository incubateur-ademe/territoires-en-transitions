import { Injectable, Logger } from '@nestjs/common';
import { FicheCreateAuthorization } from '@tet/backend/plans/fiches/create-fiche/fiche-create-authorization';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { FicheDuplicationService } from '@tet/backend/plans/fiches/fiche-duplication/fiche-duplication.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { AxeIdRemapping } from '@tet/backend/plans/plans/duplicate-plan/duplicated-fiche.mapper';
import { FicheWithRelations } from '@tet/domain/plans';
import {
  DuplicateFicheError,
  DuplicateFicheErrorEnum,
} from './duplicate-fiche.errors';
import { DuplicateFicheInput } from './duplicate-fiche.input';

const ownedByCollectivite = (
  fiches: FicheWithRelations[],
  collectiviteId: number
): FicheWithRelations[] =>
  fiches.filter((fiche) => fiche.collectiviteId === collectiviteId);

const identityAxeRemapping = (fiche: FicheWithRelations): AxeIdRemapping =>
  new Map((fiche.axes ?? []).map((axe) => [axe.id, axe.id]));

@Injectable()
export class DuplicateFicheService {
  private readonly logger = new Logger(DuplicateFicheService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissionService: PermissionService,
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly listFichesService: ListFichesService,
    private readonly ficheDuplicationService: FicheDuplicationService
  ) {}

  async duplicate(
    { ficheId }: DuplicateFicheInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<{ ficheId: number }, DuplicateFicheError>> {
    return this.transactionManager.executeSingle<
      { ficheId: number },
      DuplicateFicheError
    >(async (transaction) => {
      const existingFiche =
        await this.ficheActionPermissionsService.getFicheFromId(
          ficheId,
          transaction
        );
      if (!existingFiche) {
        return failure(DuplicateFicheErrorEnum.FICHE_NOT_FOUND);
      }
      const { collectiviteId } = existingFiche;

      const authorizationResult = await this.buildWriteAuthorization(
        user,
        collectiviteId,
        transaction
      );
      if (!authorizationResult.success) return authorizationResult;
      const authorization = authorizationResult.data;

      const { data: matchedFiches } =
        await this.listFichesService.listFichesQuery(
          collectiviteId,
          { ficheIds: [ficheId] },
          undefined,
          transaction
        );
      const [source] = ownedByCollectivite(matchedFiches, collectiviteId);
      if (!source) {
        return failure(DuplicateFicheErrorEnum.FICHE_NOT_FOUND);
      }

      const { data: matchedChildren } =
        await this.listFichesService.listFichesQuery(
          collectiviteId,
          { parentsId: [ficheId] },
          undefined,
          transaction
        );
      const sousActions = ownedByCollectivite(matchedChildren, collectiviteId);

      const created = await this.ficheDuplicationService.duplicateFiche({
        source,
        collectiviteId,
        parentId: source.parentId,
        authorization,
        axeIdRemapping: identityAxeRemapping(source),
        tx: transaction,
        titre: source.titre ? `${source.titre} (copie)` : source.titre,
      });
      if (!created.success) {
        return failure(DuplicateFicheErrorEnum.DUPLICATE_FICHE_ERROR);
      }
      const newFicheId = created.data;

      for (const sousAction of sousActions) {
        const createdChild =
          await this.ficheDuplicationService.duplicateFiche({
            source: sousAction,
            collectiviteId,
            parentId: newFicheId,
            authorization,
            axeIdRemapping: identityAxeRemapping(sousAction),
            tx: transaction,
          });
        if (!createdChild.success) {
          return failure(DuplicateFicheErrorEnum.DUPLICATE_FICHE_ERROR);
        }
      }

      this.logger.log(
        `Fiche ${ficheId} dupliquée vers ${newFicheId} (${sousActions.length} sous-actions) pour la collectivité ${collectiviteId}`
      );
      return success({ ficheId: newFicheId });
    }, tx);
  }

  private async buildWriteAuthorization(
    user: AuthenticatedUser,
    collectiviteId: number,
    tx: Transaction
  ): Promise<Result<FicheCreateAuthorization, DuplicateFicheError>> {
    try {
      const authorization = await FicheCreateAuthorization.forCollectivite(
        this.permissionService,
        user,
        collectiviteId,
        tx
      );
      return success(authorization);
    } catch (error) {
      this.logger.warn(
        `Duplication de fiche refusée sur la collectivité ${collectiviteId}: ${
          error instanceof Error ? error.message : error
        }`
      );
      return failure(DuplicateFicheErrorEnum.UNAUTHORIZED);
    }
  }
}
