import { Injectable } from '@nestjs/common';
import { DemarchePlanActionsRepository } from './demarche-plan-actions.repository';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ListAxesRepository } from '@tet/backend/plans/axes/list-axes/list-axes.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { PlanStatus, PlanStatusEnum } from '@tet/domain/plans';
import { inArray } from 'drizzle-orm';
import type { DemarchePlanContenu } from './models/demarche-plan-contenu.dto';

/**
 * Le programme d'actions d'une démarche, en lecture.
 *
 * Sert les deux côtés du dossier. Pour l'instructeur, c'est le seul chemin : il
 * n'a aucun droit sur les plans de la collectivité déposante, les routes `plans`
 * le refuseraient, et ce contenu ne lui parvient qu'au travers du dossier
 * d'instruction dont l'accès est déjà autorisé. Pour la déposante, c'est la même
 * vue aplatie qu'on lui remet en rappel pendant la finalisation — d'où la mise
 * en commun ici, plutôt qu'une seconde traversée qui divergerait.
 */
@Injectable()
export class DemarchePlansContenuRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly listAxesRepository: ListAxesRepository
  ) {}

  async listPlansAvecContenu(
    {
      demarcheId,
      collectiviteId,
      hideFichesRestreintes = false,
      activePlansOnly = false,
    }: {
      demarcheId: number;
      collectiviteId: number;
      /**
       * Écarte les fiches restreintes, pour un lecteur sans
       * `plans.fiches.read_confidentiel`. Les instructeurs et la déposante les
       * voient : le dossier transmis les comprend.
       */
      hideFichesRestreintes?: boolean;
      /**
       * Écarte, avant toute traversée, les plans encore en import ou à
       * vérifier : la lecture publique ne montre que des plans aboutis.
       */
      activePlansOnly?: boolean;
    },
    tx?: Transaction
  ): Promise<DemarchePlanContenu[]> {
    const planIds = await this.planActionsRepository.listPlanActionIds(
      demarcheId,
      tx
    );
    if (planIds.length === 0) {
      return [];
    }

    const racines = await this.getRacinesDesPlans(planIds, tx);
    const plans: DemarchePlanContenu[] = [];
    const plansToRead = activePlansOnly
      ? planIds.filter(
          (planId) => racines.get(planId)?.status === PlanStatusEnum.ACTIVE
        )
      : planIds;

    for (const planId of plansToRead) {
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
          nom: racines.get(planId)?.nom ?? null,
          status: racines.get(planId)?.status ?? PlanStatusEnum.ACTIVE,
          nbFiches: 0,
          fiches: [],
          axes: [],
        });
        continue;
      }

      const fiches = await this.getFiches(
        axesResult.data.flatMap((axe) => axe.fiches),
        tx
      );
      const isReadable = (id: number) =>
        !hideFichesRestreintes || fiches.get(id)?.restreint !== true;
      const toFiches = (ficheIds: number[]) =>
        ficheIds
          .filter(isReadable)
          .map((id) => ({ id, titre: fiches.get(id)?.titre ?? null }));

      // La racine de l'arbre est le plan lui-même : ses fiches sont rattachées
      // au plan sans passer par un axe, et l'écran les présente comme telles.
      const [racine, ...sousAxes] = axesResult.data;

      plans.push({
        id: planId,
        nom: racines.get(planId)?.nom ?? null,
        status: racines.get(planId)?.status ?? PlanStatusEnum.ACTIVE,
        // Compté sur l'arbre, pas en base : une même fiche peut être rangée
        // dans plusieurs axes, et le décompte doit suivre les mêmes exclusions
        // que le contenu affiché.
        nbFiches: new Set(
          axesResult.data.flatMap((axe) => axe.fiches).filter(isReadable)
        ).size,
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

  private async getRacinesDesPlans(
    planIds: number[],
    tx?: Transaction
  ): Promise<Map<number, { nom: string | null; status: PlanStatus }>> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ id: axeTable.id, nom: axeTable.nom, status: axeTable.status })
      .from(axeTable)
      .where(inArray(axeTable.id, planIds));

    return new Map(rows.map(({ id, ...racine }) => [id, racine]));
  }

  private async getFiches(
    ficheIds: number[],
    tx?: Transaction
  ): Promise<Map<number, { titre: string | null; restreint: boolean }>> {
    const uniques = [...new Set(ficheIds)];
    if (uniques.length === 0) {
      return new Map();
    }

    const rows = await (tx ?? this.databaseService.db)
      .select({
        id: ficheActionTable.id,
        titre: ficheActionTable.titre,
        restreint: ficheActionTable.restreint,
      })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, uniques));

    return new Map(
      rows.map(({ id, titre, restreint }) => [
        id,
        { titre, restreint: restreint === true },
      ])
    );
  }
}
