import { Injectable, Logger } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Fiche, FicheSecteurs, FicheWithRelations } from '@tet/domain/plans';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { groupBy, isNil, uniq } from 'es-toolkit';
import z from 'zod';
import { DatabaseService } from '../../utils/database/database.service';
import { FicheSecteursAttributionRepository } from './fiche-secteurs/fiche-secteurs-attribution.repository';
import { toFicheSecteurs } from './fiche-secteurs/fiche-secteurs.rules';
import { QueryOptionsSchema } from './list-fiches/list-fiches.request';
import { axeTable } from './shared/models/axe.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';

const _getPlanRequestSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
});

type GetPlanRequest = z.infer<typeof _getPlanRequestSchema>;

export type Plan = Awaited<ReturnType<PlanActionsService['getPlan']>>;
export type PlanRow = Plan['rows'][number];
export type PlanFiche = PlanRow['fiche'];

type AxeEtFicheIds = Awaited<
  ReturnType<PlanActionsService['getAxesEtFicheIds']>
>[number];

type PlanData = ReturnType<PlanActionsService['toPlanData']>;

type PlanContent = {
  /** Fiches de premier niveau rattachées aux axes du plan */
  fiches: FicheWithRelations[];
  /** Sous-actions de ces fiches : sans axe, elles suivent leur fiche parente */
  sousActions: FicheWithRelations[];
  secteursByFicheId: Map<number, FicheSecteurs>;
};

// même ordre qu'à l'écran
const SOUS_ACTIONS_QUERY_OPTIONS: QueryOptionsSchema = {
  sort: [{ field: 'created_at', direction: 'asc' }],
  limit: 'all',
};

@Injectable()
export default class PlanActionsService {
  private readonly logger = new Logger(PlanActionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fichePermissionsService: FicheActionPermissionsService,
    private readonly listFichesService: ListFichesService,
    private readonly ficheSecteursAttributionRepository: FicheSecteursAttributionRepository
  ) {}

  async count(collectiviteId: number): Promise<number> {
    const result = await this.databaseService.db
      .select({ count: count() })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          isNull(axeTable.parent)
        )
      );

    return result[0]?.count ?? 0;
  }
  /**
   * Charge les axes et les fiches d'un plan
   */
  async getPlan(input: GetPlanRequest, user: AuthUser) {
    const { collectiviteId, planId } = input;

    this.logger.log(
      `Charge les axes et les fiches du plan ${planId} de la collectivité ${collectiviteId}`
    );

    // peut lire les fiches et les axes (déclenche une exception sinon)
    await this.fichePermissionsService.hasReadFichePermission(
      { collectiviteId, restreint: false },
      user
    );

    const axesEtFicheIds = await this.getAxesEtFicheIds(input);
    const { data: fiches } =
      await this.listFichesService.getFichesActionResumes(
        {
          collectiviteId,
          filters: { planActionIds: [planId] },
          readsMaskedFields: true,
        },
        { user }
      );
    // une fiche restreinte illisible est déjà exclue : ses sous-actions ne sont pas demandées
    const sousActions = fiches.length
      ? (
          await this.listFichesService.getFichesActionResumes(
            {
              collectiviteId,
              filters: { parentsId: fiches.map((f) => f.id) },
              queryOptions: SOUS_ACTIONS_QUERY_OPTIONS,
              readsMaskedFields: true,
            },
            { user }
          )
        ).data
      : [];
    const secteursByFicheId = await this.getSecteursByFicheId([
      ...fiches,
      ...sousActions,
    ]);

    return this.buildPlan(axesEtFicheIds, {
      fiches,
      sousActions,
      secteursByFicheId,
    });
  }

  /**
   * Charge un plan hors contexte utilisateur, sans contrôle d'accès : fiches
   * restreintes comprises. À réserver aux traitements de la plateforme.
   */
  async getPlanSnapshot(
    input: GetPlanRequest,
    { tx }: { tx?: Transaction } = {}
  ): Promise<{
    plan: Plan;
    /** `null` si le plan n'a aucune fiche ni sous-action restreinte */
    planWithoutFichesRestreintes: Plan | null;
  }> {
    const { collectiviteId, planId } = input;

    const axesEtFicheIds = await this.getAxesEtFicheIds(input, tx);
    const { data: fiches } = await this.listFichesService.listFichesQuery(
      collectiviteId,
      { planActionIds: [planId] },
      { limit: 'all' },
      tx
    );
    const sousActions = fiches.length
      ? (
          await this.listFichesService.listFichesQuery(
            collectiviteId,
            { parentsId: fiches.map((f) => f.id) },
            SOUS_ACTIONS_QUERY_OPTIONS,
            tx
          )
        ).data
      : [];
    const secteursByFicheId = await this.getSecteursByFicheId(
      [...fiches, ...sousActions],
      tx
    );

    const plan = this.buildPlan(axesEtFicheIds, {
      fiches,
      sousActions,
      secteursByFicheId,
    });

    const hasFicheRestreinte = [...fiches, ...sousActions].some(
      (f) => f.restreint
    );
    if (!hasFicheRestreinte) {
      return { plan, planWithoutFichesRestreintes: null };
    }

    const visibleFiches = fiches.filter((f) => !f.restreint);
    const visibleFicheIds = new Set(visibleFiches.map((f) => f.id));
    // une sous-action suit sa fiche parente
    const visibleSousActions = sousActions.filter(
      (f) =>
        !f.restreint && !isNil(f.parentId) && visibleFicheIds.has(f.parentId)
    );

    return {
      plan,
      planWithoutFichesRestreintes: this.buildPlan(axesEtFicheIds, {
        fiches: visibleFiches,
        sousActions: visibleSousActions,
        secteursByFicheId,
      }),
    };
  }

  private async getSecteursByFicheId(
    fiches: FicheWithRelations[],
    tx?: Transaction
  ): Promise<Map<number, FicheSecteurs>> {
    const attributions =
      await this.ficheSecteursAttributionRepository.listByFicheIds(
        fiches.map((f) => f.id),
        tx
      );
    return new Map(
      attributions.map((attribution) => [
        attribution.ficheId,
        toFicheSecteurs(attribution),
      ])
    );
  }

  // extrait les données dérivées nécessaires à l'export
  private buildPlan(axesEtFicheIds: AxeEtFicheIds[], content: PlanContent) {
    const planData = this.toPlanData(axesEtFicheIds, content);
    const { root } = planData;
    const rows = this.getRows(planData, root);
    const maxDepth = Math.max(...rows.map((r) => r.depth));
    const anneesNotes = uniq(
      rows.flatMap((r) =>
        r.fiche?.notes?.map((n) => new Date(n.dateNote).getFullYear())
      )
    )
      .filter(Boolean)
      .sort() as number[];
    const maxFinanceurs = Math.max(
      ...rows.map((r) => r.fiche?.financeurs?.length ?? 0)
    );

    return {
      /** Racine du plan */
      root,
      /** Une ligne par fiche ou sous-action */
      rows,
      /** Profondeur maximum d'une fiche dans le plan */
      maxDepth,
      /** Années distinctes pour lesquelles il y a au moins une fiche avec une note */
      anneesNotes,
      /** Nombre de financeurs maximum */
      maxFinanceurs,
    };
  }

  private toPlanData(
    axesEtFicheIds: AxeEtFicheIds[],
    { fiches, sousActions, secteursByFicheId }: PlanContent
  ) {
    // extrait et tri les fiches associées à un axe
    const getFiches = ({ ficheIds }: AxeEtFicheIds) =>
      ficheIds?.length && fiches?.length
        ? fiches.filter((f) => ficheIds.includes(f.id)).sort(this.sortByTitle)
        : null;

    // extrait les sous-axes associés à un axe
    const getChildren = (parentId: number | null) => {
      return axesEtFicheIds.filter((r) => r.parent === parentId);
    };

    // les sous-actions sont déjà triées par date de création
    const sousActionsByParentId = groupBy(
      sousActions.filter((f) => !isNil(f.parentId)),
      (f) => f.parentId as number
    );
    const getSousActions = (ficheId: number): FicheWithRelations[] =>
      sousActionsByParentId[ficheId] ?? [];

    const getSecteurs = (ficheId: number) =>
      secteursByFicheId.get(ficheId) ?? null;

    return {
      root: getChildren(null)[0],
      getChildren,
      getFiches,
      getSousActions,
      getSecteurs,
    };
  }

  // génère récursivement une ligne par fiche pour l'export xlsx
  private getRows(
    plan: PlanData,
    axe: AxeEtFicheIds,
    path: string[] = [],
    depth = 0,
    rows: Array<
      Omit<AxeEtFicheIds, 'ficheIds'> & {
        fiche: FicheWithRelations | null;
        /** Renseignée sur la ligne d'une sous-action */
        parentFiche: FicheWithRelations | null;
        /** `null` : la fiche n'a pas d'attribution enregistrée */
        secteurs: FicheSecteurs | null;
        path: string[];
        depth: number;
      }
    > = []
  ) {
    const { getFiches, getChildren, getSousActions, getSecteurs } = plan;
    const fiches = getFiches(axe);
    const { id, nom, parent } = axe;

    if (fiches?.length) {
      const row = { id, nom, parent, depth, path };

      fiches.forEach((fiche) => {
        rows.push({
          ...row,
          fiche,
          parentFiche: null,
          secteurs: getSecteurs(fiche.id),
        });
        // les sous-actions suivent leur fiche parente, sur l'axe de celle-ci
        getSousActions(fiche.id).forEach((sousAction) => {
          rows.push({
            ...row,
            fiche: sousAction,
            parentFiche: fiche,
            secteurs: getSecteurs(sousAction.id),
          });
        });
      });
    }

    const children = getChildren(axe.id);
    const nextDepth = depth + 1;
    const nextPath = depth > 0 ? path.concat(nom || 'Sans titre') : path;
    children.forEach((child) =>
      rows.concat(...this.getRows(plan, child, nextPath, nextDepth, rows))
    );
    return rows;
  }

  private getAxesEtFicheIds(input: GetPlanRequest, tx?: Transaction) {
    const ficheIdsParAxe = this.getFicheIdsParAxe(input);
    return (tx ?? this.databaseService.db)
      .with(ficheIdsParAxe)
      .select({
        id: axeTable.id,
        nom: axeTable.nom,
        parent: axeTable.parent,
        ficheIds: ficheIdsParAxe.fiches,
      })
      .from(axeTable)
      .leftJoin(ficheIdsParAxe, eq(ficheIdsParAxe.axeId, axeTable.id))
      .where(eq(axeTable.plan, input.planId))
      .orderBy(sql`naturalsort(${axeTable.nom}) asc`);
  }

  private getFicheIdsParAxe({ collectiviteId }: GetPlanRequest) {
    return this.databaseService.db.$with('fichesParAxe').as(
      this.databaseService.db
        .select({
          axeId: ficheActionAxeTable.axeId,
          fiches: sql<
            Fiche['id'][]
          >`json_agg(${ficheActionTable.id}) FILTER (WHERE ${ficheActionTable.id} IS NOT NULL)`.as(
            'fiches'
          ),
        })
        .from(ficheActionAxeTable)
        .leftJoin(
          ficheActionTable,
          eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
        )
        .where(
          and(
            eq(ficheActionTable.collectiviteId, collectiviteId),
            eq(ficheActionTable.deleted, false)
          )
        )
        .groupBy(ficheActionAxeTable.axeId)
    );
  }

  private sortByTitle(
    a: { titre: string | null },
    b: { titre: string | null }
  ) {
    if (a.titre === null && b.titre === null) return 0;
    if (a.titre === null) return -1;
    if (b.titre === null) return 1;
    return a.titre.localeCompare(b.titre, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }
}
