import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { and, eq, gt, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import { panierTable, PanierType } from '../models/panier.table';
import {
  ActionImpactSnippetType,
  actionImpactTable,
} from '../models/action-impact.table';
import { thematiqueTable } from '../../taxonomie/models/thematique.table';
import ActionImpactService from './action-impact.service';
import { PanierGateway } from '../panier.gateway';
import AxeService from '../../fiches/services/axe.service';
import FicheService from '../../fiches/services/fiche.service';
import DocumentService from '../../documents/services/document.service';
import PanierPartenaireService from '../../taxonomie/services/panier-partenaire.service';
import DirectusService from '../../directus/service/directus.service';
import { Datas } from '../models/maj-action-impact-datas.dto';
import ThematiqueService from '../../taxonomie/services/thematique.service';
import IndicateursService from '../../indicateurs/services/indicateurs.service';
import { actionImpactCategorieTable } from '../models/action-impact-categorie.table';
import { actionImpactThematiqueTable } from '../models/action-impact-thematique.table';
import { actionImpactPanierTable } from '../models/action-impact-panier.table';
import { actionImpactStatutTable } from '../models/action-impact-statut.table';
import {
  ActionImpactStateType,
  PanierCompletType,
} from '../models/get-panier-complet.response';
import {
  SupabaseJwtPayload,
  SupabaseRole,
} from '../../auth/models/supabase-jwt.models';

@Injectable()
export default class PanierService {
  private readonly logger = new Logger(PanierService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly panierGateway: PanierGateway,
    private readonly panierPartenaireService: PanierPartenaireService,
    private readonly directusService: DirectusService,
    private readonly thematiqueService: ThematiqueService,
    private readonly indicateurService: IndicateursService,
    private readonly actionImpactService: ActionImpactService
  ) {}

  /**
   * Récupère le panier de la collectivité et le créé s'il n'en existe pas un récent (moins d'un mois)
   * @param collectiviteId identifiant de la collectivité
   * @return le panier de la collectivité
   */
  async getPanier(collectiviteId?: number): Promise<PanierType | null> {
    let panier = null;
    if (collectiviteId) {
      const paniers = await this.databaseService.db
        .select()
        .from(panierTable)
        .where(
          and(
            eq(panierTable.collectivitePreset, collectiviteId),
            isNull(panierTable.collectiviteId),
            gt(
              panierTable.createdAt,
              sql.raw(`current_timestamp - interval '1 month'`)
            )
          )
        );
      panier = paniers.length > 0 ? paniers[0] : null;
    }
    if (!panier) {
      const paniers = await this.databaseService.db
        .insert(panierTable)
        .values({
          collectiviteId: null,
          collectivitePreset: collectiviteId ? collectiviteId : null,
        })
        .returning();
      panier = paniers.length > 0 ? paniers[0] : null;
    }
    return panier;
  }

  /**
   * Ajoute une action à impact à un panier
   * @param actionId identifiant de l'action à impact
   * @param panierId identifiant du panier
   */
  async addActionImpact(actionId: number, panierId: string): Promise<void> {
    this.logger.log(`Ajout de l'action ${actionId} dans le panier ${panierId}`);
    await this.databaseService.db.insert(actionImpactPanierTable).values({
      actionId: actionId,
      panierId: panierId,
    });
    this.panierGateway.emitPanierUpdate(panierId);
  }

  /**
   * Enlève une action à impact à un panier
   * @param actionId identifiant de l'action à impact
   * @param panierId identifiant du panier
   */
  async removeActionImpact(actionId: number, panierId: string): Promise<void> {
    this.logger.log(`Retrait de l'action ${actionId} du panier ${panierId}`);
    await this.databaseService.db
      .delete(actionImpactPanierTable)
      .where(
        and(
          eq(actionImpactPanierTable.actionId, actionId),
          eq(actionImpactPanierTable.panierId, panierId)
        )
      );
    this.panierGateway.emitPanierUpdate(panierId);
  }

  /**
   * Modifie le statut d'une action à impact pour un panier donné
   * @param actionId identifiant de l'action à impact
   * @param panierId identifiant du panier
   * @param categorieId identifiant de la catégorie, null pour l'enlever
   */
  async setActionImpactCategorie(
    actionId: number,
    panierId: string,
    categorieId: string | null
  ): Promise<void> {
    if (categorieId) {
      this.logger.log(
        `Remplacement par le statut ${categorieId} sur l'action ${actionId} pour le panier ${panierId}`
      );
      await this.databaseService.db
        .insert(actionImpactStatutTable)
        .values({
          actionId: actionId,
          panierId: panierId,
          categorieId: categorieId,
        })
        .onConflictDoUpdate({
          target: [
            actionImpactStatutTable.actionId,
            actionImpactStatutTable.panierId,
          ],
          set: { categorieId: categorieId },
        });
    } else {
      this.logger.log(
        `Retrait de la catégorie sur l'action ${actionId} pour le panier ${panierId}`
      );
      await this.databaseService.db
        .delete(actionImpactCategorieTable)
        .where(
          and(
            eq(actionImpactPanierTable.actionId, actionId),
            eq(actionImpactPanierTable.panierId, panierId)
          )
        );
    }
    this.panierGateway.emitPanierUpdate(panierId);
  }

  /**
   * Récupère la liste d'actions à impact avec leur statut vis à vis d'un panier selon des filtres
   * @param panierId identifiant d'un panier
   * @param thematiqueIds identifiants des thématiques voulus
   * @param niveauxBudget identifiants des niveaux de budgets voulus
   * @param niveauxTemps identifiants des niveaux de temps voulus
   * @return les actions à impact filtrées
   */
  async getActionImpactsFiltered(
    panierId: string,
    thematiqueIds: number[],
    niveauxBudget: number[],
    niveauxTemps: number[]
  ): Promise<ActionImpactStateType[]> {
    const where = [];

    if (thematiqueIds && thematiqueIds.length > 0) {
      where.push(isNotNull(thematiqueTable.id)); // TODO pas sure que ça marche
      where.push(inArray(thematiqueTable.id, thematiqueIds));
    }
    if (niveauxBudget && niveauxBudget.length > 0) {
      where.push(isNotNull(actionImpactTable.fourchetteBudgetaire));
      where.push(
        inArray(actionImpactTable.fourchetteBudgetaire, niveauxBudget)
      );
    }
    if (niveauxTemps && niveauxTemps.length > 0) {
      where.push(isNotNull(actionImpactTable.tempsDeMiseEnOeuvre));
      where.push(inArray(actionImpactTable.tempsDeMiseEnOeuvre, niveauxTemps));
    }

    const actions = await this.databaseService.db
      .select({
        action: actionImpactTable,
        statut: actionImpactStatutTable,
        thematique: thematiqueTable,
        isInPanier: actionImpactPanierTable.actionId,
      })
      .from(actionImpactTable)
      .leftJoin(
        actionImpactStatutTable,
        and(
          eq(actionImpactTable.id, actionImpactStatutTable.actionId),
          eq(actionImpactStatutTable.panierId, panierId)
        )
      )
      .leftJoin(
        actionImpactThematiqueTable,
        eq(actionImpactTable.id, actionImpactThematiqueTable.actionImpactId)
      )
      .leftJoin(
        thematiqueTable,
        eq(actionImpactThematiqueTable.thematiqueId, thematiqueTable.id)
      )
      .leftJoin(
        actionImpactPanierTable,
        and(
          eq(actionImpactPanierTable.actionId, actionImpactTable.id),
          eq(actionImpactPanierTable.panierId, panierId)
        )
      )
      .where(and(...where));

    return Object.values(
      actions.reduce((acc, row) => {
        const actionId = row.action.id;

        if (!acc[actionId]) {
          acc[actionId] = {
            action: {
              ...row.action,
              rex: Array.isArray(row.action.rex) ? row.action.rex : [],
              subventionsMobilisables: Array.isArray(
                row.action.subventionsMobilisables
              )
                ? row.action.subventionsMobilisables
                : [],
              ressourcesExternes: Array.isArray(row.action.ressourcesExternes)
                ? row.action.ressourcesExternes
                : [],
            },
            isinpanier: !!row.isInPanier,
            statut: row.statut || null,
            thematiques: [],
          };
        }

        if (row.thematique) {
          acc[actionId].thematiques.push(row.thematique);
        }

        return acc;
      }, {} as Record<number, ActionImpactStateType>)
    );
  }

  /**
   * Récupère le panier complet et les actions à impacts vis à vis du panier
   * @param panierId identifiant d'un panier
   * @param thematiqueIds identifiants des thématiques voulus
   * @param niveauxBudget identifiants des niveaux de budgets voulus
   * @param niveauxTemps identifiants des niveaux de temps voulus
   * @return les actions à impact filtrées
   */
  async getPanierComplet(
    panierId: string,
    thematiqueIds: number[],
    niveauxBudget: number[],
    niveauxTemps: number[]
  ): Promise<PanierCompletType | null> {
    const paniersResult = await this.databaseService.db
      .select()
      .from(panierTable)
      .leftJoin(
        actionImpactPanierTable,
        eq(actionImpactPanierTable.panierId, panierTable.id)
      )
      .leftJoin(
        actionImpactTable,
        eq(actionImpactTable.id, actionImpactPanierTable.actionId)
      )
      .leftJoin(
        actionImpactThematiqueTable,
        eq(actionImpactTable.id, actionImpactThematiqueTable.actionImpactId)
      )
      .leftJoin(
        thematiqueTable,
        eq(actionImpactThematiqueTable.thematiqueId, thematiqueTable.id)
      )
      .where(eq(panierTable.id, panierId));

    if (paniersResult.length > 0) {
      const actionsFiltrees = await this.getActionImpactsFiltered(
        panierId,
        thematiqueIds,
        niveauxBudget,
        niveauxTemps
      );
      return {
        ...paniersResult[0].panier,
        contenu: Object.values(
          paniersResult
            .filter((f) => f.action_impact !== null)
            .reduce((acc, row) => {
              const actionId = row.action_impact!.id;

              if (!acc[actionId]) {
                acc[actionId] = {
                  ...row.action_impact!,
                  rex: Array.isArray(row.action_impact!.rex)
                    ? row.action_impact!.rex
                    : [],
                  subventionsMobilisables: Array.isArray(
                    row.action_impact!.subventionsMobilisables
                  )
                    ? row.action_impact!.subventionsMobilisables
                    : [],
                  ressourcesExternes: Array.isArray(
                    row.action_impact!.ressourcesExternes
                  )
                    ? row.action_impact!.ressourcesExternes
                    : [],
                  thematiques: [],
                };
              }

              if (row.thematique) {
                acc[actionId].thematiques.push(row.thematique);
              }

              return acc;
            }, {} as Record<number, ActionImpactSnippetType>)
        ),
        states: actionsFiltrees,
      };
    }
    return null;
  }

  /**
   * Met à jour les données du panier depuis directus
   * @param tokenInfo token de l'utilisateur
   */
  async majPanierFromDirectus(tokenInfo: SupabaseJwtPayload) {
    if (tokenInfo.role !== SupabaseRole.SERVICE_ROLE) {
      throw new UnauthorizedException(`Droits insuffisants`);
    }
    // Met à jour les partenaires possibles du panier provenant de directus
    await this.panierPartenaireService.majPartenairePanierFromDirectus();
    // Récupère des données utile à la mise à jour des actions à impact
    const datas: Datas = {
      // Besoin de récupérer les indicateurs car directus a pour identifiant l'identifiant_referentiel ...
      // ... et non l'id
      indicateurs: await this.indicateurService.getIndicateursPredefinisMap(),
      // Besoin de récupérer les sous thématiques car les ids entre directus et la BD ne correspondent pas, ...
      // ... le lien doit se faire via le nom
      sousThematiques: await this.thematiqueService.getSousThematiquesMap(),
      sousThematiquesDirectus:
        await this.directusService.getSousThematiquesFromDirectus(),
    };
    // Récupère les actions à impact provenant de directus
    const actions = await this.directusService.getActionsImpactFromDirectus();
    for (const action of actions) {
      // Met à jour les actions à impact et les champs associées provenant de directus
      await this.actionImpactService.majActionImpactFromDirectus(action, datas);
    }
  }

  /**
   * La liste des collectivités dans lesquelles on peut
   * créer un plan à partir d'un panier.
   */
  /*
    async mesCollectivites(): Promise<MesCollectivite> {
        const {data, error} = await this.supabase
            .from('mes_collectivites')
            .select('collectiviteId, nom, niveau_acces, est_auditeur')
            .in('niveau_acces', ['admin', 'edition'])
            .returns<MesCollectivite>();
        if (error) throw error;
        return data;
    }*/
}
