import { PlanService } from '@/backend/plans/plans/plans.service';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import FicheActionCreateService from '../fiche-action-create.service';
import { AxeImport, FicheImport, PlanImport } from '../import-plan.dto';
import { Result, failure, success } from '../types/result';

interface AxeMapping {
  axeId: number;
  ficheIds: number[];
}

/**
 * PlanAggregate represents a complete plan with its axes and fiches.
 * It handles the creation and management of the entire plan structure,
 * ensuring data consistency and proper relationships between entities.
 */
@Injectable()
export class PlanAggregateService {
  private readonly logger = new Logger(PlanAggregateService.name);

  constructor(
    private readonly planService: PlanService,
    private readonly ficheService: FicheActionCreateService
  ) {}

  /**
   * Create a new fiche with all its related data
   */
  private async createFiche(
    fiche: FicheImport,
    collectiviteId: number,
    tx: Transaction
  ): Promise<Result<number, string>> {
    try {
      // Create the fiche
      const ficheId = await this.ficheService.createFiche(
        {
          collectiviteId,
          titre: fiche.titre,
          description: fiche.description,
          objectifs: fiche.objectifs,
          ressources: fiche.resources,
          financements: fiche.financements,
          calendrier: fiche.calendrier,
          notesComplementaires: fiche.notesComplementaire,
          ameliorationContinue: fiche.ameliorationContinue,
          dateDebut: fiche.dateDebut,
          dateFin: fiche.dateFin,
          statut: fiche.statut,
          priorite: fiche.priorite,
          participationCitoyenneType: fiche.participation,
          instanceGouvernance: fiche.gouvernance,
        },
        tx
      );

      // Add pilotes
      if (fiche.pilotes?.length) {
        await Promise.all(
          fiche.pilotes.map((pilote) =>
            this.ficheService.addPilote(
              ficheId,
              pilote.tag?.id,
              pilote.userId,
              tx
            )
          )
        );
      }

      // Add referents
      if (fiche.referents?.length) {
        await Promise.all(
          fiche.referents.map((referent) =>
            this.ficheService.addReferent(
              ficheId,
              referent.tag?.id,
              referent.userId,
              tx
            )
          )
        );
      }

      // Add structures
      if (fiche.structures?.length) {
        await Promise.all(
          fiche.structures.map((structure) =>
            structure.id
              ? this.ficheService.addStructure(ficheId, structure.id, tx)
              : Promise.resolve()
          )
        );
      }

      // Add services
      if (fiche.services?.length) {
        await Promise.all(
          fiche.services.map((service) =>
            service.id
              ? this.ficheService.addService(ficheId, service.id, tx)
              : Promise.resolve()
          )
        );
      }

      // Add financeurs
      if (fiche.financeurs?.length) {
        await Promise.all(
          fiche.financeurs.map((financeur) =>
            financeur.tag.id
              ? this.ficheService.addFinanceur(
                  ficheId,
                  financeur.tag.id,
                  financeur.montant,
                  tx
                )
              : Promise.resolve()
          )
        );
      }

      // Add budget if present
      if (fiche.budget !== undefined) {
        await this.ficheService.addBudgetPrevisionnel(
          ficheId,
          fiche.budget.toString(),
          tx
        );
      }

      return success(ficheId);
    } catch (error) {
      this.logger.error(`Error creating fiche ${fiche.titre}:`, error);
      return failure(
        `Error creating fiche ${fiche.titre}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create a new axe and its child axes recursively
   */
  private async createAxe(
    axe: AxeImport,
    planId: number,
    parentId: number | null,
    collectiviteId: number,
    tx: Transaction,
    user: AuthenticatedUser
  ): Promise<Result<AxeMapping, string>> {
    try {
      // Create the axe
      const axeResult = await this.planService.upsertAxe(
        {
          planId,
          parent: parentId || 0,
          collectiviteId,
          nom: axe.nom,
        },
        user
      );

      if ('error' in axeResult) {
        return failure(axeResult.error);
      }

      // Recursively create child axes
      const childResults = await Promise.all(
        Array.from(axe.enfants).map((child) =>
          this.createAxe(
            child,
            planId,
            axeResult.data.id,
            collectiviteId,
            tx,
            user
          )
        )
      );

      const childError = childResults.find((result) => !result.success);
      if (childError) {
        return failure(childError.error);
      }

      return success({
        axeId: axeResult.data.id,
        ficheIds: axe.fiches
          .map((f) => f.id)
          .filter((id): id is number => id !== undefined),
      });
    } catch (error) {
      this.logger.error(`Error creating axe ${axe.nom}:`, error);
      return failure(
        `Error creating axe ${axe.nom}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create a new plan with all its axes and fiches
   */
  async createPlan(
    plan: PlanImport,
    collectiviteId: number,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<number, string>> {
    try {
      this.logger.log(
        `Creating plan ${plan.nom} for collectivité ${collectiviteId}`
      );

      // First create all fiches
      const ficheResults = await Promise.all(
        plan.fiches.map((fiche) => this.createFiche(fiche, collectiviteId, tx))
      );

      // Check for fiche creation errors
      const ficheError = ficheResults.find((result) => !result.success);
      if (ficheError) {
        return failure(ficheError.error);
      }

      // Create the plan
      const createPlanResult = await this.planService.createPlan(
        {
          collectiviteId,
          nom: plan.nom,
          typeId: plan.typeId,
          pilotes: plan.pilotes,
          referents: plan.referents,
        },
        user,
        tx
      );

      if ('error' in createPlanResult) {
        return failure(createPlanResult.error);
      }

      // Create all root axes
      const axeResults = await Promise.all(
        Array.from(plan.enfants).map((axe) =>
          this.createAxe(
            axe,
            createPlanResult.data.id,
            null,
            collectiviteId,
            tx,
            user
          )
        )
      );

      const axeError = axeResults.find((result) => !result.success);
      if (axeError) {
        return failure(axeError.error);
      }

      // Link fiches to axes
      const axeMappings = axeResults
        .filter(
          (r): r is Result<AxeMapping, string> & { success: true } => r.success
        )
        .map((r) => r.data);

      // Link each fiche to its axe
      for (const mapping of axeMappings) {
        if (mapping.ficheIds.length > 0) {
          // TODO: Add linkFichesToAxe to PlanService
          // For now, we'll just log that we need to link fiches
          this.logger.warn(
            `Need to link fiches ${mapping.ficheIds.join(', ')} to axe ${
              mapping.axeId
            }`
          );
        }
      }

      this.logger.log(`Successfully created plan ${plan.nom}`);
      return success(createPlanResult.data.id);
    } catch (error) {
      this.logger.error(`Error creating plan:`, error);
      return failure(
        `Error creating plan: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
