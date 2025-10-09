import { PlanService } from '@/backend/plans/plans/plans.service';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import FicheActionCreateService from '../fiche-action-create.service';
import { AxeImport, FicheImport, PlanImport } from '../import-plan.dto';
import { Result, failure, success } from '../types/result';

interface SavePlanParams {
  plan: PlanImport;
  collectiviteId: number;
  user: AuthenticatedUser;
  tx: Transaction;
}

interface SaveFicheParams {
  fiche: FicheImport;
  collectiviteId: number;
  tx: Transaction;
}

/**
 * Save a fiche and all its related data
 */
async function saveFiche(
  { fiche, collectiviteId, tx }: SaveFicheParams,
  ficheService: FicheActionCreateService
): Promise<Result<number, string>> {
  try {
    // Create the fiche
    const ficheId = await ficheService.createFiche(
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
          ficheService.addPilote(ficheId, pilote.tag?.id, pilote.userId, tx)
        )
      );
    }

    // Add referents
    if (fiche.referents?.length) {
      await Promise.all(
        fiche.referents.map((referent) =>
          ficheService.addReferent(
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
            ? ficheService.addStructure(ficheId, structure.id, tx)
            : Promise.resolve()
        )
      );
    }

    // Add services
    if (fiche.services?.length) {
      await Promise.all(
        fiche.services.map((service) =>
          service.id
            ? ficheService.addService(ficheId, service.id, tx)
            : Promise.resolve()
        )
      );
    }

    // Add financeurs
    if (fiche.financeurs?.length) {
      await Promise.all(
        fiche.financeurs.map((financeur) =>
          financeur.tag.id
            ? ficheService.addFinanceur(
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
      await ficheService.addBudgetPrevisionnel(
        ficheId,
        fiche.budget.toString(),
        tx
      );
    }

    return success(ficheId);
  } catch (error) {
    return failure(
      `Error saving fiche ${fiche.titre}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Save a plan and all its related data
 */
export async function savePlan(
  { plan, collectiviteId, user, tx }: SavePlanParams,
  planService: PlanService,
  ficheService: FicheActionCreateService
): Promise<Result<number, string>> {
  try {
    // First save all fiches
    const ficheResults = await Promise.all(
      plan.fiches.map((fiche) =>
        saveFiche({ fiche, collectiviteId, tx }, ficheService)
      )
    );

    // Check for fiche save errors
    const ficheError = ficheResults.find((result) => !result.success);
    if (ficheError) {
      return failure(ficheError.error);
    }

    // Create a map of fiches to their IDs
    const ficheIds = ficheResults.map((result) =>
      result.success ? result.data : 0
    );

    // Create the plan
    const createPlanResult = await planService.createPlan(
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

    // Helper function to recursively save axes
    const saveAxe = async (
      axe: AxeImport,
      parentId: number | null
    ): Promise<Result<void, string>> => {
      try {
        // Save the axe
        const axeResult = await planService.upsertAxe(
          {
            planId: createPlanResult.data.id,
            parent: parentId || 0,
            collectiviteId,
            nom: axe.nom,
            ficheIds: axe.fiches.map((f) => ficheIds[plan.fiches.indexOf(f)]),
          },
          tx
        );

        if ('error' in axeResult) {
          return failure(axeResult.error);
        }

        // Recursively save child axes
        const childResults = await Promise.all(
          Array.from(axe.enfants).map((child) =>
            saveAxe(child, axeResult.data.id)
          )
        );

        const childError = childResults.find((result) => !result.success);
        return childError || success(undefined);
      } catch (error) {
        return failure(
          `Error saving axe ${axe.nom}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    };

    // Save all root axes
    const axeResults = await Promise.all(
      Array.from(plan.enfants).map((axe) => saveAxe(axe, null))
    );

    const axeError = axeResults.find((result) => !result.success);
    if (axeError) {
      return failure(axeError.error);
    }

    return success(createPlanResult.data.id);
  } catch (error) {
    return failure(
      `Error saving plan: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
