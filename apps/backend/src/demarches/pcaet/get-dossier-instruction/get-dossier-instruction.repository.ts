import { Injectable } from '@nestjs/common';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ListAxesRepository } from '@tet/backend/plans/axes/list-axes/list-axes.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { inArray } from 'drizzle-orm';
import type { DossierInstructionPlan } from './get-dossier-instruction.output';

/**
 * Le programme d'actions tel que l'instructeur peut le lire.
 *
 * L'instructeur n'a aucun droit sur les plans de la collectivité déposante : les
 * routes `plans` le refuseraient. Ce contenu ne lui parvient donc qu'au travers
 * du dossier d'instruction, dont l'accès est déjà autorisé — d'où cette lecture
 * ici plutôt qu'un appel côté front.
 */
@Injectable()
export class GetDossierInstructionRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly listAxesRepository: ListAxesRepository
  ) {}

  async listPlansAvecContenu(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DossierInstructionPlan[]> {
    const planIds = await this.planActionsRepository.listPlanActionIds(
      demarcheId,
      tx
    );
    if (planIds.length === 0) {
      return [];
    }

    const noms = await this.getNomsDesPlans(planIds, tx);
    const plans: DossierInstructionPlan[] = [];

    for (const planId of planIds) {
      // La traversée récursive des axes est celle des écrans « plans » : même
      // tri naturel, mêmes fiches écartées (supprimées, ou rangées sous une
      // fiche mère). La dupliquer serait s'exposer à ce qu'elles divergent.
      const axesResult = await this.listAxesRepository.listChildrenRecursively(
        { parentId: planId, collectiviteId },
        tx
      );
      if (!axesResult.success) {
        // Un plan illisible ne doit pas emporter le dossier : il apparaît sans
        // son contenu, ce que l'écran sait afficher.
        plans.push({
          id: planId,
          nom: noms.get(planId) ?? null,
          nbFiches: 0,
          fiches: [],
          axes: [],
        });
        continue;
      }

      const titres = await this.getTitresDesFiches(
        axesResult.data.flatMap((axe) => axe.fiches),
        tx
      );
      const toFiches = (ficheIds: number[]) =>
        ficheIds.map((id) => ({ id, titre: titres.get(id) ?? null }));

      // La racine de l'arbre est le plan lui-même : ses fiches sont rattachées
      // au plan sans passer par un axe, et l'écran les présente comme telles.
      const [racine, ...sousAxes] = axesResult.data;

      plans.push({
        id: planId,
        nom: noms.get(planId) ?? null,
        // Compté sur l'arbre, pas en base : une même fiche peut être rangée
        // dans plusieurs axes, et le décompte doit suivre les mêmes exclusions
        // que le contenu affiché.
        nbFiches: new Set(axesResult.data.flatMap((axe) => axe.fiches)).size,
        fiches: toFiches(racine?.fiches ?? []),
        axes: sousAxes.map((axe) => ({
          id: axe.id,
          nom: axe.nom,
          depth: axe.depth,
          fiches: toFiches(axe.fiches),
        })),
      });
    }

    return plans;
  }

  private async getNomsDesPlans(
    planIds: number[],
    tx?: Transaction
  ): Promise<Map<number, string | null>> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ id: axeTable.id, nom: axeTable.nom })
      .from(axeTable)
      .where(inArray(axeTable.id, planIds));

    return new Map(rows.map((row) => [row.id, row.nom]));
  }

  private async getTitresDesFiches(
    ficheIds: number[],
    tx?: Transaction
  ): Promise<Map<number, string | null>> {
    const uniques = [...new Set(ficheIds)];
    if (uniques.length === 0) {
      return new Map();
    }

    const rows = await (tx ?? this.databaseService.db)
      .select({ id: ficheActionTable.id, titre: ficheActionTable.titre })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, uniques));

    return new Map(rows.map((row) => [row.id, row.titre]));
  }
}
