import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import {
  actionImpactTable,
  ActionImpactTransformeType,
} from '../models/action-impact.table';
import { axeTable, CreateAxeType } from '../../fiches/models/axe.table';
import AxeService from '../../fiches/services/axe.service';
import FicheService from '../../fiches/services/fiche.service';
import DocumentService from '../../documents/services/document.service';
import {
  panierPartenaireTable,
  PanierPartenaireType,
} from '../../taxonomie/models/panier-partenaire.table';
import {
  actionImpactCategorieTable,
  ActionImpactCategorieType,
} from '../models/action-impact-categorie.table';
import {
  actionImpactThematiqueTable,
  ActionImpactThematiqueType,
} from '../models/action-impact-thematique.table';
import {
  actionImpactSousThematiqueTable,
  ActionImpactSousThematiqueType,
} from '../models/action-impact-sous-thematique.table';
import {
  actionImpactFourchetteBudgetaireTable,
  ActionImpactFourchetteBudgetaireType,
} from '../models/action-impact-fourchette-budgetaire.table';
import {
  actionImpactIndicateurTable,
  ActionImpactIndicateurType,
} from '../models/action-impact-indicateur.table';
import {
  actionImpactEffetAttenduTable,
  ActionImpactEffetAttenduType,
} from '../models/action-impact-effet-attendu.table';
import {
  actionImpactActionTable,
  ActionImpactActionType,
} from '../models/action-impact-action.table';
import { actionImpactPartenaireTable } from '../models/action-impact-partenaire.table';
import { actionImpactPanierTable } from '../models/action-impact-panier.table';
import { actionImpactStatutTable } from '../models/action-impact-statut.table';
import { lienType } from '../../documents/models/document-lien.dto';
import { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
import { AuthService } from '../../auth/services/auth.service';
import BrevoService from '../../brevo/service/brevo.service';
import { BrevoLists } from '../../brevo/models/brevo.models';
import { FicheActionStatutsEnumType } from '../../fiches/models/fiche-action.table';

// Crée un type qui permettra de parcourir facilement les actions
type actionsFromPanier = {
  action_impact: ActionImpactTransformeType;
  action_impact_thematique: ActionImpactThematiqueType[];
  action_impact_sous_thematique: ActionImpactSousThematiqueType[];
  action_impact_indicateur: ActionImpactIndicateurType[];
  action_impact_effet_attendu: ActionImpactEffetAttenduType[];
  action_impact_action: ActionImpactActionType[];
  panier_partenaire: PanierPartenaireType[];
  action_impact_fourchette_budgetaire: ActionImpactFourchetteBudgetaireType | null;
  action_impact_categorie: ActionImpactCategorieType | null;
};

const LISTS_TO_REMOVE = [
  BrevoLists.ID_LIST_BREVO_ONBOARDING_GENERAL,
  BrevoLists.ID_LIST_BREVO_CREATION_PA,
  BrevoLists.ID_LIST_BREVO_SONDAGE_PA_1,
  BrevoLists.ID_LIST_BREVO_SONDAGE_PA_2,
];

@Injectable()
export default class PlanFromPanierService {
  private readonly logger = new Logger(PlanFromPanierService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly axeService: AxeService,
    private readonly ficheService: FicheService,
    private readonly documentService: DocumentService,
    private readonly authService: AuthService,
    private readonly brevoService: BrevoService
  ) {}

  /**
   * Crée un plan d'action pour la collectivité à partir d'un panier
   * @param tokenInfo token de l'utilisateur
   * @param collectiviteId identifiant de la collectivité
   * @param panierId identifiant du panier
   * @param planId identifiant du plan dans lequel ajouter les fiches, indéfini pour créer un nouveau plan
   * @return identifiant du plan d'actions créé
   */
  async addPlanFromPanier(
    tokenInfo: SupabaseJwtPayload,
    collectiviteId: number,
    panierId: string,
    planId?: number
  ): Promise<number> {
    // Vérifie les droits
    await this.authService.verifieAccesRestreintCollectivite(
      tokenInfo,
      collectiviteId
    );
    let axeId;
    if (!planId) {
      // Crée le plan
      const axe: CreateAxeType = {
        collectiviteId: collectiviteId,
        nom: "Plan d'action à impact",
        panierId: panierId,
      };
      axeId = await this.axeService.createOrReturnAxeId(axe);
    } else {
      axeId = planId;
    }
    // Fait le lien entre le plan et le panier
    await this.databaseService.db
      .update(axeTable)
      .set({ panierId: panierId })
      .where(eq(axeTable.id, axeId));

    const actions = await this.getActionsFromPanier(panierId);

    // Pour chaque action à impact du panier
    for (const action of actions) {
      await this.addFicheFromActionImpact(collectiviteId, axeId, action);
    }
    // Envoie à Brevo de l'utilisateur
    await this.sendUserPaiToBrevo(tokenInfo);
    return axeId;
  }

  /**
   * Récupère les actions du panier ainsi que leurs informations liées
   * @param panierId identifiant du panier
   * @return les actions à impact et leurs informations liées
   */
  private async getActionsFromPanier(
    panierId: string
  ): Promise<actionsFromPanier[]> {
    const result = await this.databaseService.db
      .select()
      .from(actionImpactTable)
      .innerJoin(
        actionImpactPanierTable,
        eq(actionImpactTable.id, actionImpactPanierTable.actionId)
      )
      .leftJoin(
        actionImpactThematiqueTable,
        eq(actionImpactTable.id, actionImpactThematiqueTable.actionImpactId)
      )
      .leftJoin(
        actionImpactSousThematiqueTable,
        eq(actionImpactTable.id, actionImpactSousThematiqueTable.actionImpactId)
      )
      .leftJoin(
        actionImpactFourchetteBudgetaireTable,
        eq(
          actionImpactTable.fourchetteBudgetaire,
          actionImpactFourchetteBudgetaireTable.niveau
        )
      )
      .leftJoin(
        actionImpactIndicateurTable,
        eq(actionImpactTable.id, actionImpactIndicateurTable.actionImpactId)
      )
      .leftJoin(
        actionImpactEffetAttenduTable,
        eq(actionImpactTable.id, actionImpactEffetAttenduTable.actionImpactId)
      )
      .leftJoin(
        actionImpactActionTable,
        eq(actionImpactTable.id, actionImpactActionTable.actionImpactId)
      )
      .leftJoin(
        actionImpactPartenaireTable,
        eq(actionImpactTable.id, actionImpactPartenaireTable.actionImpactId)
      )
      .leftJoin(
        panierPartenaireTable,
        eq(panierPartenaireTable.id, actionImpactPartenaireTable.partenaireId)
      )
      .leftJoin(
        actionImpactStatutTable,
        and(
          eq(actionImpactTable.id, actionImpactStatutTable.actionId),
          eq(actionImpactPanierTable.panierId, actionImpactStatutTable.panierId)
        )
      )
      .leftJoin(
        actionImpactCategorieTable,
        eq(actionImpactStatutTable.categorieId, actionImpactCategorieTable.id)
      )
      .where(eq(actionImpactPanierTable.panierId, panierId));

    // Transforme le résultat de la requête en des objects
    // de type addPlanFromPanierResult plus facile à manipuler
    return Object.values(
      result.reduce((acc, row) => {
        const actionId = row.action_impact.id;

        if (!acc[actionId]) {
          acc[actionId] = {
            action_impact: {
              ...row.action_impact,
              rex: Array.isArray(row.action_impact.rex)
                ? row.action_impact.rex
                : [],
              subventionsMobilisables: Array.isArray(
                row.action_impact.subventionsMobilisables
              )
                ? row.action_impact.subventionsMobilisables
                : [],
              ressourcesExternes: Array.isArray(
                row.action_impact.ressourcesExternes
              )
                ? row.action_impact.ressourcesExternes
                : [],
            },
            action_impact_thematique: [],
            action_impact_sous_thematique: [],
            action_impact_indicateur: [],
            action_impact_effet_attendu: [],
            action_impact_action: [],
            panier_partenaire: [],
            action_impact_fourchette_budgetaire:
              row.action_impact_fourchette_budgetaire,
            action_impact_categorie: row.action_impact_categorie,
          };
        }

        if (row.action_impact_thematique) {
          acc[actionId].action_impact_thematique.push(
            row.action_impact_thematique
          );
        }
        if (row.action_impact_sous_thematique) {
          acc[actionId].action_impact_sous_thematique.push(
            row.action_impact_sous_thematique
          );
        }
        if (row.action_impact_indicateur) {
          acc[actionId].action_impact_indicateur.push(
            row.action_impact_indicateur
          );
        }
        if (row.action_impact_effet_attendu) {
          acc[actionId].action_impact_effet_attendu.push(
            row.action_impact_effet_attendu
          );
        }
        if (row.action_impact_action) {
          acc[actionId].action_impact_action.push(row.action_impact_action);
        }
        if (row.panier_partenaire) {
          acc[actionId].panier_partenaire.push(row.panier_partenaire);
        }

        return acc;
      }, {} as Record<number, actionsFromPanier>)
    );
  }

  /**
   * Crée une fiche depuis une action à impact
   * @param collectiviteId identifiant de la collectivité
   * @param axeId identifiant du plan
   * @param action action à impact et ses informations liées
   */
  private async addFicheFromActionImpact(
    collectiviteId: number,
    axeId: number,
    action: actionsFromPanier
  ) {
    // On créé une fiche
    const ficheId = await this.ficheService.createFiche({
      titre: action.action_impact.titre,
      description: action.action_impact.description,
      collectiviteId: collectiviteId,
      financements: action.action_impact_fourchette_budgetaire?.nom || null,
      /*statut: ['en_cours', 'realise'].includes(
        action.action_impact_categorie?.id || '',
      )
        ? Object.values(FicheActionStatutsEnumType)
          .find((enumValue) =>
            enumValue === action.action_impact_categorie!.nom)
        : FicheActionStatutsEnumType.A_VENIR,*/
    });
    // TODO faire l'ajout du statut
    // On ajoute la fiche au plan
    await this.axeService.addFicheAction(ficheId, axeId);
    // On fait le lien vers l'action à impact à l'origine de la fiche
    await this.ficheService.addActionImpact(ficheId, action.action_impact.id);
    // On ajoute les thématiques
    if (action.action_impact_thematique) {
      for (const thematique of action.action_impact_thematique) {
        await this.ficheService.addThematique(ficheId, thematique.thematiqueId);
      }
    }
    // On ajoute les sous-thématiques
    if (action.action_impact_sous_thematique) {
      for (const thematique of action.action_impact_sous_thematique) {
        await this.ficheService.addSousThematique(
          ficheId,
          thematique.sousThematiqueId
        );
      }
    }
    // On ajoute les indicateurs
    if (action.action_impact_indicateur) {
      for (const indicateur of action.action_impact_indicateur) {
        await this.ficheService.addIndicateur(ficheId, indicateur.indicateurId);
      }
    }
    // On ajoute les effets attendus
    if (action.action_impact_effet_attendu) {
      for (const effet of action.action_impact_effet_attendu) {
        await this.ficheService.addEffetAttendu(ficheId, effet.effetAttenduId);
      }
    }
    // On ajoute les actions
    if (action.action_impact_action) {
      for (const actionRef of action.action_impact_action) {
        await this.ficheService.addActionReferentiel(
          ficheId,
          actionRef.actionId
        );
      }
    }

    // On ajoute les liens ressources
    if (action.action_impact.ressourcesExternes) {
      for (const ressource of action.action_impact.ressourcesExternes) {
        await this.documentService.createLienAnnexe(
          ficheId,
          ressource as lienType,
          collectiviteId
        );
      }
    }
    if (action.action_impact.rex) {
      for (const ressource of action.action_impact.rex) {
        await this.documentService.createLienAnnexe(
          ficheId,
          ressource as lienType,
          collectiviteId
        );
      }
    }

    // On ajoute les partenaires
    if (action.panier_partenaire) {
      for (const partenaire of action.panier_partenaire) {
        await this.ficheService.addPartenaireByNom(
          ficheId,
          partenaire.nom,
          collectiviteId
        );
      }
    }
  }

  /**
   * Envoie l'utilisateur qui a crée un plan depuis le plan d'action à Brevo si c'est un utilisateur récent
   * @param tokenInfo
   */
  private async sendUserPaiToBrevo(tokenInfo: SupabaseJwtPayload) {
    const email = tokenInfo.email;
    const user = await this.authService.getUserCrmInfo(tokenInfo);
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    // On envoie l'utilisateur que si c'est un nouvel utilisateur
    if (user && user.creation && new Date(user.creation) > hier) {
      const emails = [];
      if (email) {
        // Vérifie si le contact existe déjà dans Brevo
        const contactJson = await this.brevoService.getContactByEmail(email);

        if (contactJson) {
          this.logger.log('get contact' + contactJson.email);
          // Vérifie si le contact appartient déjà à la liste
          if (
            !contactJson.listIds.includes(
              BrevoLists.ID_LIST_BREVO_ONBOARDING_PAI
            )
          ) {
            emails.push(email);
          }
          // Vérifie si le contact appartient aux autres listes, et si oui, les enlève
          for (const listId of LISTS_TO_REMOVE) {
            if (contactJson.listIds.includes(listId)) {
              await this.brevoService.removeContactsFromList(emails, listId);
              this.logger.log(
                'remove contact' + contactJson.email + ' from list ' + listId
              );
            }
          }
        } else {
          // Ajoute le contact
          if (await this.brevoService.addContact(user)) {
            emails.push(email);
            this.logger.log('add contact ' + email + ' to Brevo');
          }
        }
      }
    }
  }
}
