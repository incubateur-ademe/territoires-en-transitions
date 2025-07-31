import FicheActionPermissionsService from '@/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import {
  Fiche,
  ficheActionTable,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { AuthUser } from '@/backend/users/models/auth.models';
import { Injectable, Logger } from '@nestjs/common';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { uniq } from 'es-toolkit';
import z from 'zod';
import { DatabaseService } from '../../utils/database/database.service';
import { FicheWithRelations } from './list-fiches/fiche-action-with-relations.dto';
import { axeTable, AxeType } from './shared/models/axe.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';

const getPlanRequestSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
});

type GetPlanRequest = z.infer<typeof getPlanRequestSchema>;

export type Plan = Awaited<ReturnType<PlanActionsService['getPlan']>>;
export type PlanRow = Plan['rows'][number];
export type PlanFiche = PlanRow['fiche'];

type AxeEtFicheIds = Awaited<
  ReturnType<PlanActionsService['getAxesEtFicheIds']>
>[number];

type PlanData = Awaited<ReturnType<PlanActionsService['fetchPlan']>>;

@Injectable()
export default class PlanActionsService {
  private readonly logger = new Logger(PlanActionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fichePermissionsService: FicheActionPermissionsService,
    private readonly listFichesService: ListFichesService
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

  async list(collectiviteId: number): Promise<AxeType[]> {
    return this.databaseService.db
      .select()
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          isNull(axeTable.parent)
        )
      );
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
    this.fichePermissionsService.hasReadFichePermission(
      { collectiviteId, restreint: false },
      user
    );

    // pour vérifier si il faut charger ou non les fiches en accès restreint
    const hasReadPrivateFichePermission =
      await this.fichePermissionsService.hasReadFichePermission(
        { collectiviteId, restreint: true },
        user,
        true
      );

    // charge le plan et extrait les données dérivées nécessaires à l'export
    const plan = await this.fetchPlan(input, hasReadPrivateFichePermission);
    const { root } = plan;
    const rows = this.getRows(plan, root);
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
      /** Une ligne par fiche */
      rows,
      /** Profondeur maximum d'une fiche dans le plan */
      maxDepth,
      /** Années distinctes pour lesquelles il y a au moins une fiche avec une note de suivi */
      anneesNotes,
      /** Nombre de financeurs maximum */
      maxFinanceurs,
    };
  }

  private async fetchPlan(
    input: GetPlanRequest,
    hasReadPrivateFichePermission: boolean
  ) {
    const { collectiviteId, planId } = input;

    // charge les données
    const axesEtFicheIds = await this.getAxesEtFicheIds(input);
    const fiches = await this.listFichesService.getFichesAction(
      collectiviteId,
      {
        planActionIds: [planId],
        restreint: hasReadPrivateFichePermission ? undefined : false,
      }
    );

    // extrait et tri les fiches associées à un axe
    const getFiches = ({ ficheIds }: AxeEtFicheIds) =>
      ficheIds?.length && fiches?.length
        ? fiches.filter((f) => ficheIds.includes(f.id)).sort(this.sortByTitle)
        : null;

    // extrait les sous-axes associés à un axe
    const getChildren = (parentId: number | null) => {
      return axesEtFicheIds.filter((r) => r.parent === parentId);
    };

    return {
      root: getChildren(null)[0],
      getChildren,
      getFiches,
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
        path: string[];
        depth: number;
      }
    > = []
  ) {
    const { getFiches, getChildren } = plan;
    const fiches = getFiches(axe);
    const { id, nom, parent } = axe;

    if (fiches?.length) {
      const row = { id, nom, parent, depth, path, fiche: null };
      fiches.forEach((fiche) => rows.push({ ...row, fiche }));
    }

    const children = getChildren(axe.id);
    const nextDepth = depth + 1;
    const nextPath = depth > 0 ? path.concat(nom || 'Sans titre') : path;
    children.forEach((child) =>
      rows.concat(...this.getRows(plan, child, nextPath, nextDepth, rows))
    );
    return rows;
  }

  private getAxesEtFicheIds(input: GetPlanRequest) {
    const ficheIdsParAxe = this.getFicheIdsParAxe(input);
    return this.databaseService.db
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
        .where(eq(ficheActionTable.collectiviteId, collectiviteId))
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
