import { Injectable } from '@nestjs/common';
import { AddAnnexeService } from '@tet/backend/plans/fiches/add-annexe/add-annexe.service';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { FicheCreateAuthorization } from '@tet/backend/plans/fiches/create-fiche/fiche-create-authorization';
import { FicheActionBudgetService } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  AxeIdRemapping,
  mapSourceFicheToDuplicate,
} from '@tet/backend/plans/plans/duplicate-plan/duplicated-fiche.mapper';
import { mapSourceFicheAnnexes } from '@tet/backend/plans/plans/duplicate-plan/duplicated-fiche-annexes.mapper';
import { mapSourceFicheBudgets } from '@tet/backend/plans/plans/duplicate-plan/duplicated-fiche-budgets.mapper';
import { FicheWithRelations } from '@tet/domain/plans';

export type FicheDuplicationError = 'SERVER_ERROR';

@Injectable()
export class FicheDuplicationService {
  constructor(
    private readonly createFicheService: CreateFicheService,
    private readonly ficheBudgetService: FicheActionBudgetService,
    private readonly addAnnexeService: AddAnnexeService
  ) {}

  async duplicateFiche({
    source,
    collectiviteId,
    parentId,
    authorization,
    axeIdRemapping,
    tx,
  }: {
    source: FicheWithRelations;
    collectiviteId: number;
    parentId: number | null;
    authorization: FicheCreateAuthorization;
    axeIdRemapping: AxeIdRemapping;
    tx: Transaction;
  }): Promise<Result<number, FicheDuplicationError>> {
    const { fiche, ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId,
      parentId,
      axeIdRemapping,
    });

    const created = await this.createFicheService.createFicheWithAuthorization({
      authorization,
      fiche,
      ficheFields,
      tx,
    });
    if (!created.success) {
      return failure('SERVER_ERROR');
    }
    const newFicheId = created.data.id;

    const budgetsResult = await this.copyBudgets(source, newFicheId, tx);
    if (!budgetsResult.success) return budgetsResult;

    const annexesResult = await this.copyAnnexes({
      source,
      newFicheId,
      modifiedBy: authorization.user.id,
      tx,
    });
    if (!annexesResult.success) return annexesResult;

    return success(newFicheId);
  }

  private async copyBudgets(
    source: FicheWithRelations,
    newFicheId: number,
    tx: Transaction
  ): Promise<Result<undefined, FicheDuplicationError>> {
    const budgets = mapSourceFicheBudgets(source, newFicheId);
    const result = await this.ficheBudgetService.insertBudgets(budgets, tx);
    if (!result.success) {
      return failure('SERVER_ERROR');
    }
    return success(undefined);
  }

  private async copyAnnexes({
    source,
    newFicheId,
    modifiedBy,
    tx,
  }: {
    source: FicheWithRelations;
    newFicheId: number;
    modifiedBy: string;
    tx: Transaction;
  }): Promise<Result<undefined, FicheDuplicationError>> {
    const sourceAnnexes =
      await this.addAnnexeService.loadRawAnnexesForDuplication(
        source.id,
        source.collectiviteId,
        tx
      );
    const annexes = mapSourceFicheAnnexes(sourceAnnexes, {
      newFicheId,
      collectiviteId: source.collectiviteId,
      modifiedBy,
    });
    const result = await this.addAnnexeService.insertAnnexes(annexes, tx);
    if (!result.success) {
      return failure('SERVER_ERROR');
    }
    return success(undefined);
  }
}
