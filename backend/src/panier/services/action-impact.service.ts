import { Injectable, Logger } from '@nestjs/common';
import {
  ActionImpactDetailsType,
  actionImpactTable,
} from '../models/action-impact.table';
import { eq, getTableColumns, sql } from 'drizzle-orm';
import { thematiqueTable } from '../../taxonomie/models/thematique.table';
import { Datas } from '../models/maj-action-impact-datas.dto';
import { ActionImpact } from '../../directus/models/directus.models';
import { actionImpactThematiqueTable } from '../models/action-impact-thematique.table';
import { actionImpactCategorieFNVTable } from '../models/action-impact-cateorie-fnv.table';
import { categorieFNVTable } from '../../taxonomie/models/categorie-fnv.table';
import { actionImpactSousThematiqueTable } from '../models/action-impact-sous-thematique.table';
import { actionImpactIndicateurTable } from '../models/action-impact-indicateur.table';
import { actionImpactEffetAttenduTable } from '../models/action-impact-effet-attendu.table';
import { actionImpactPartenaireTable } from '../models/action-impact-partenaire.table';
import { actionImpactActionTable } from '../models/action-impact-action.table';
import DatabaseService from '../../common/services/database.service';
import { actionImpactBanaticCompetenceTable } from '../models/action-impact-banatic-competence.table';

@Injectable()
export default class ActionImpactService {
  private readonly logger = new Logger(ActionImpactService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Récupère une action à impact plus ses thématiques et ses catégories FNV
   * @param actionImpactId identifiant de l'action à récupérer
   * @return l'action détaillé
   */
  async getActionImpactDetails(
    actionImpactId: number,
  ): Promise<ActionImpactDetailsType | null> {
    this.logger.log(
      `Récupération du détail de l'action à impact ${actionImpactId}`,
    );
    const actions = await this.databaseService.db
      .select({
        ...getTableColumns(actionImpactTable),
        thematiques: {
          id: thematiqueTable.id,
          nom: thematiqueTable.nom,
        },
        categoriesFNV: { ...getTableColumns(categorieFNVTable) },
      })
      .from(actionImpactTable)
      .leftJoin(
        actionImpactThematiqueTable,
        eq(actionImpactTable.id, actionImpactThematiqueTable.actionImpactId),
      )
      .leftJoin(
        thematiqueTable,
        eq(actionImpactThematiqueTable.thematiqueId, thematiqueTable.id),
      )
      .leftJoin(
        actionImpactCategorieFNVTable,
        eq(actionImpactTable.id, actionImpactCategorieFNVTable.actionImpactId),
      )
      .leftJoin(
        categorieFNVTable,
        eq(actionImpactCategorieFNVTable.categorieFnvId, categorieFNVTable.id),
      )
      .where(eq(actionImpactTable.id, actionImpactId))
      .limit(1);
    return actions.length > 0 ? (actions[0] as ActionImpactDetailsType) : null;
  }

  /**
   * Upsert une action à impact en BDD ainsi que les tables associées
   * @param action
   * @param datas données provenant de directus et de la BDD utiles à la sauvegarde
   */
  async majActionImpactFromDirectus(
    action: ActionImpact,
    datas: Datas,
  ): Promise<void> {
    // Upsert action_impact
    const actionToSave = {
      id: action.id,
      titre: action.titre,
      description: action.description_courte,
      fourchetteBudgetaire: action.fourchette_budgetaire?.niveau,
      descriptionComplementaire: action.description_longue || '',
      tempsDeMiseEnOeuvre: action.temps_de_mise_en_oeuvre?.niveau,
      ressourcesExternes: action.ressources_externes,
      rex: action.rex,
      subventionsMobilisables: action.subventions_mobilisables,
    };
    await this.databaseService.db
      .insert(actionImpactTable)
      .values(actionToSave)
      .onConflictDoUpdate({
        target: actionImpactTable.id,
        set: {
          titre: sql.raw(`excluded.titre`),
          description: sql.raw(`excluded.description`),
          fourchetteBudgetaire: sql.raw(`excluded.fourchette_budgetaire`),
          descriptionComplementaire: sql.raw(
            `excluded.description_complementaire`,
          ),
          tempsDeMiseEnOeuvre: sql.raw(`excluded.temps_de_mise_en_oeuvre`),
          ressourcesExternes: sql.raw(`excluded.ressources_externes`),
          rex: sql.raw(`excluded.rex`),
          subventionsMobilisables: sql.raw(`excluded.subventions_mobilisables`),
        },
      });
    Logger.log(
      `Action ${action.id} - Sauvegarde de l''action à impact : réussi`,
    );
    // Upsert action_impact_thematique
    await this.databaseService.db
      .delete(actionImpactThematiqueTable)
      .where(eq(actionImpactThematiqueTable.actionImpactId, action.id));
    for (const thematique of action.thematiques) {
      const query = await this.databaseService.db
        .insert(actionImpactThematiqueTable)
        .values({
          actionImpactId: action.id,
          thematiqueId: thematique.thematique_id,
        });
      if (!query) {
        Logger.log(
          `Action ${action.id} - Sauvegarde de la thématique ${thematique.thematique_id} : échec`,
        );
      } else {
        Logger.log(
          `Action ${action.id} - Sauvegarde de la thématique ${thematique.thematique_id} : réussi`,
        );
      }
    }

    // Upsert action_impact_sous-thématique
    // /!\ sous_thematiques.sous_thematiqueId ne match pas les id en BDD, il faut faire le lien via le nom
    await this.databaseService.db
      .delete(actionImpactSousThematiqueTable)
      .where(eq(actionImpactSousThematiqueTable.actionImpactId, action.id));
    for (const thematique of action.sous_thematiques) {
      // Récupère le nom de la sous thématique dans directus
      const thematiqueDirectus = datas.sousThematiquesDirectus.find(
        (t) => t.id === thematique.sous_thematique_id,
      );
      if (thematiqueDirectus) {
        // Fait le lien avec la sous thématique en BDD via le nom
        const thematiqueBDD = datas.sousThematiques.get(thematiqueDirectus.nom);
        if (thematiqueBDD) {
          const query = await this.databaseService.db
            .insert(actionImpactSousThematiqueTable)
            .values({
              actionImpactId: action.id,
              sousThematiqueId: thematiqueBDD.id,
            });
          if (!query) {
            Logger.log(
              `Action ${action.id} - Sauvegarde de la sous thématique ${thematiqueBDD.id} : échec`,
            );
          } else {
            Logger.log(
              `Action ${action.id} - Sauvegarde de la sous thématique ${thematiqueBDD.id} : réussi`,
            );
          }
        }
      }
    }

    // Upsert action_impact_indicateur
    // /!\ Directus fait le lien vers les identifiants référentiels des indicateurs et non les ids BDD
    await this.databaseService.db
      .delete(actionImpactIndicateurTable)
      .where(eq(actionImpactIndicateurTable.actionImpactId, action.id));
    for (const indicateur of action.indicateurs) {
      // Récupère l'indentifiant BDD de l'indicateur à partir de son identifiant référentiel
      const indicateurId = datas.indicateurs.get(
        indicateur.indicateur_predefini_id!,
      )?.id;
      if (indicateurId) {
        const query = await this.databaseService.db
          .insert(actionImpactIndicateurTable)
          .values({
            actionImpactId: action.id,
            indicateurId: indicateurId,
          });
        if (!query) {
          Logger.log(
            `Action ${action.id} - Sauvegarde de l'indicateur ${indicateur.indicateur_predefini_id} : échec`,
          );
        } else {
          Logger.log(
            `Action ${action.id} - Sauvegarde de l'indicateur ${indicateur.indicateur_predefini_id} : réussi`,
          );
        }
      }
    }

    // Upsert action_impact_effet_attendu
    await this.databaseService.db
      .delete(actionImpactEffetAttenduTable)
      .where(eq(actionImpactEffetAttenduTable.actionImpactId, action.id));
    for (const effet of action.effets_attendus) {
      await this.databaseService.db
        .insert(actionImpactEffetAttenduTable)
        .values({
          actionImpactId: action.id,
          effetAttenduId: effet.action_impact_effet_attendu_id,
        });
      Logger.log(
        `Action ${action.id} - Sauvegarde de l'effet attendu ${effet.action_impact_effet_attendu_id} réussi`,
      );
    }

    // Upsert action_impact_partenaire
    await this.databaseService.db
      .delete(actionImpactPartenaireTable)
      .where(eq(actionImpactPartenaireTable.actionImpactId, action.id));
    for (const partenaire of action.partenaires) {
      const query = await this.databaseService.db
        .insert(actionImpactPartenaireTable)
        .values({
          actionImpactId: action.id,
          partenaireId: partenaire.action_impact_partenaire_id,
        });
      if (!query) {
        Logger.log(
          `Action ${action.id} - Sauvegarde du partenaire ${partenaire.action_impact_partenaire_id} : échec`,
        );
      } else {
        Logger.log(
          `Action ${action.id} - Sauvegarde du partenaire ${partenaire.action_impact_partenaire_id} : réussi`,
        );
      }
    }

    // Upsert action_impact_action
    await this.databaseService.db
      .delete(actionImpactActionTable)
      .where(eq(actionImpactActionTable.actionImpactId, action.id));
    for (const actionRef of action.actions_referentiel) {
      const query = await this.databaseService.db
        .insert(actionImpactActionTable)
        .values({
          actionImpactId: action.id,
          actionId: actionRef.action_referentiel_id,
        });
      if (!query) {
        Logger.log(
          `Action ${action.id} - Sauvegarde de l'action référentiel ${actionRef.action_referentiel_id} : échec`,
        );
      } else {
        Logger.log(
          `Action ${action.id} - Sauvegarde de l'action référentiel ${actionRef.action_referentiel_id} : réussi`,
        );
      }
    }

    // Upsert action_impact_banatic_competence
    await this.databaseService.db
      .delete(actionImpactBanaticCompetenceTable)
      .where(eq(actionImpactActionTable.actionImpactId, action.id));
    for (const competence of action.banatic_competences) {
      const query = await this.databaseService.db
        .insert(actionImpactBanaticCompetenceTable)
        .values({
          actionImpactId: action.id,
          competenceCode: competence.competence_code,
        });
      if (!query) {
        Logger.log(
          `Action ${action.id} - Sauvegarde de la compétence ${competence.competence_code} : échec`,
        );
      } else {
        Logger.log(
          `Action ${action.id} - Sauvegarde de la compétence ${competence.competence_code} : réussi`,
        );
      }
    }

    // typologie pas importé
    // notes_travail pas importé
    // statut pas importé
    // elements_budgetaires pas importé
    // indicateur_impact_carbone pas importé
    // competences_communales pas importé
    // independamment_competences pas importé
    // banatic_competences_parents pas importé
    // indicateur_suivi pas importé
  }
}
