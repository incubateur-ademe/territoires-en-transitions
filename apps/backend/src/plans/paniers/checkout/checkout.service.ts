import { Injectable, Logger } from '@nestjs/common';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { GetPlanService } from '@tet/backend/plans/plans/get-plan/get-plan.service';
import { UpsertPlanService } from '@tet/backend/plans/plans/upsert-plan/upsert-plan.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { TagEnum } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { CheckoutError, CheckoutErrorEnum } from './checkout.errors';
import { CheckoutInput } from './checkout.input';
import { panierCheckoutLineToFicheAction } from './panier-checkout-line-to-fiche-action';
import { PanierCheckoutRepository } from './panier-checkout.repository';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly panierCheckoutRepository: PanierCheckoutRepository,
    private readonly upsertPlanService: UpsertPlanService,
    private readonly getPlanService: GetPlanService,
    private readonly createFicheService: CreateFicheService,
    private readonly tagService: TagService
  ) {}

  async execute(
    input: CheckoutInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<{ planId: number }, CheckoutError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true,
      tx
    );
    if (!isAllowed) {
      return failure(CheckoutErrorEnum.UNAUTHORIZED);
    }

    return this.transactionManager.executeSingle<
      { planId: number },
      CheckoutError
    >(async (transaction) => {
      const panierCheckoutResult =
        await this.panierCheckoutRepository.getPanierCheckout(
          input.panierId,
          transaction
        );
      if (!panierCheckoutResult.success) return panierCheckoutResult;
      const panierCheckout = panierCheckoutResult.data;

      if (panierCheckout.lines.length === 0) {
        return failure(CheckoutErrorEnum.PANIER_EMPTY);
      }

      if (
        panierCheckout.proprietaireCollectiviteId !== null &&
        panierCheckout.proprietaireCollectiviteId !== input.collectiviteId
      ) {
        return failure(CheckoutErrorEnum.PANIER_FROM_OTHER_COLLECTIVITE);
      }

      const planIdResult = await this.resolvePlanId(input, user, transaction);
      if (!planIdResult.success) return planIdResult;
      const planId = planIdResult.data;

      const linkResult = await this.upsertPlanService.linkToPanier(
        planId,
        input.panierId,
        transaction
      );
      if (!linkResult.success) {
        this.logger.error(
          `linkToPanier a échoué pour le plan ${planId} et le panier ${input.panierId}: ${linkResult.error}`
        );
        return failure(CheckoutErrorEnum.LINK_PLAN_PANIER_FAILED);
      }

      const uniquePartenaireNoms = [
        ...new Set(panierCheckout.lines.flatMap((line) => line.partenaireNoms)),
      ];
      const tagResults = await Promise.all(
        uniquePartenaireNoms.map((nom) =>
          this.tagService.saveTag(
            { nom, collectiviteId: input.collectiviteId },
            TagEnum.Partenaire,
            transaction
          )
        )
      );
      const tagsCombined = combineResults(tagResults);
      if (!tagsCombined.success) {
        this.logger.error(
          `Résolution des tags partenaires échouée pour le checkout du panier ${input.panierId}: ${tagsCombined.error}`
        );
        return failure(CheckoutErrorEnum.SERVER_ERROR);
      }
      const partenaireTagsByName = new Map(
        tagsCombined.data.map((tag) => [tag.nom, tag.id])
      );

      for (const line of panierCheckout.lines) {
        const { fiche, ficheFields } = panierCheckoutLineToFicheAction(line, {
          collectiviteId: input.collectiviteId,
          planId,
          partenaireTagsByName,
        });

        const ficheResult = await this.createFicheService.createFiche(fiche, {
          ficheFields,
          user,
          tx: transaction,
        });
        if (!ficheResult.success) {
          this.logger.error(
            `createFiche a échoué pour l'action ${line.sourceActionImpactId}: ${ficheResult.error}`
          );
          return failure(CheckoutErrorEnum.CREATE_FICHE_FAILED);
        }

        await this.panierCheckoutRepository.insertAnnexesForFiche(
          {
            ficheId: ficheResult.data.id,
            collectiviteId: input.collectiviteId,
            liensExternes: line.liensExternes,
            userId: user.id,
          },
          transaction
        );
      }

      const honoredActionIds = panierCheckout.lines.map(
        (line) => line.sourceActionImpactId
      );
      await this.panierCheckoutRepository.removeActionsFromPanier(
        input.panierId,
        honoredActionIds,
        transaction
      );

      return success({ planId });
    }, tx);
  }

  private async resolvePlanId(
    input: CheckoutInput,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<number, CheckoutError>> {
    if (input.planId !== undefined) {
      // Permission PLANS.MUTATE déjà checkée en amont sur input.collectiviteId :
      // on appelle getPlan sans user pour récupérer le plan brut (root only)
      // et on vérifie ensuite manuellement que la collectivité matche, pour
      // distinguer "plan inexistant / sous-axe" de "plan d'une autre collectivité".
      const planResult = await this.getPlanService.getPlan(
        { planId: input.planId },
        undefined,
        tx
      );
      if (!planResult.success) {
        return failure(CheckoutErrorEnum.PLAN_NOT_FOUND);
      }
      if (planResult.data.collectiviteId !== input.collectiviteId) {
        return failure(CheckoutErrorEnum.PLAN_FROM_OTHER_COLLECTIVITE);
      }
      return success(input.planId);
    }
    const planResult = await this.upsertPlanService.upsertPlan(
      { nom: "Plan d'action à impact", collectiviteId: input.collectiviteId },
      user,
      tx
    );
    if (!planResult.success) {
      this.logger.error(
        `upsertPlan a échoué pour le checkout (collectivite ${input.collectiviteId}): ${planResult.error}`
      );
      return failure(CheckoutErrorEnum.UPSERT_PLAN_FAILED);
    }
    return success(planResult.data.id);
  }
}
