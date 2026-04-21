import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  actionTypeSchema,
  ActionType,
  getActionTypeFromActionId,
  getReferentielIdFromActionId,
  historiqueTypeSchema,
  HistoriqueType,
  ListHistoriqueInput,
  ListHistoriqueOutput,
  referentielIdEnumValues,
  ReferentielId,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import {
  HistoriqueUnionRow,
  ListHistoriqueRepository,
} from './list-historique.repository';

type HierarchiesByReferentielId = ReadonlyMap<ReferentielId, ActionType[]>;

@Injectable()
export class ListHistoriqueService {
  private readonly logger = new Logger(ListHistoriqueService.name);

  constructor(
    private readonly listHistoriqueRepository: ListHistoriqueRepository,
    private readonly permissions: PermissionService,
    private readonly collectivites: CollectivitesService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService
  ) {}

  /**
   * Charge la hiérarchie de chaque référentiel via le service partagé. On
   * valide chaque hiérarchie via `actionTypeSchema` à la frontière SQL :
   * une seule ligne `referentiel_definition` mal formée doit faire échouer
   * la requête (impossible de classifier les action_id sans hiérarchie).
   */
  private async getHierarchies(): Promise<HierarchiesByReferentielId> {
    const raw =
      await this.getReferentielDefinitionService.getHierarchiesByReferentielIds(
        [...referentielIdEnumValues]
      );

    return new Map(
      Array.from(raw.entries()).map(([id, hierarchie]) => [
        id,
        actionTypeSchema.array().parse(hierarchie),
      ])
    );
  }

  /**
   * Renvoie l'actionType de la ligne, ou `null` si le type ne peut pas être
   * déterminé. On journalise plutôt que de faire remonter l'erreur pour qu'une
   * seule ligne mal formée ne casse pas tout l'historique.
   */
  private safeGetActionType(
    actionId: string | null,
    hierarchies: HierarchiesByReferentielId
  ): ActionType | null {
    if (!actionId) {
      return null;
    }
    try {
      const referentielId = getReferentielIdFromActionId(actionId);
      const hierarchie = hierarchies.get(referentielId);
      if (!hierarchie) {
        return null;
      }
      return getActionTypeFromActionId(actionId, hierarchie);
    } catch (err) {
      this.logger.warn(
        `Impossible de déterminer actionType pour action_id="${actionId}": ${
          (err as Error).message
        }`
      );
      return null;
    }
  }

  /**
   * Parse le `type` SQL d'une ligne historique en `HistoriqueType` validé.
   * Une ligne dont le type ne matche pas l'enum est journalisée puis
   * renvoyée comme `null` plutôt que de faire planter toute la page.
   */
  private safeParseHistoriqueType(rawType: string): HistoriqueType | null {
    const parsed = historiqueTypeSchema.safeParse(rawType);
    if (!parsed.success) {
      this.logger.warn(
        `Type historique invalide reçu de la base : "${rawType}"`
      );
      return null;
    }
    return parsed.data;
  }

  async listHistorique(
    input: ListHistoriqueInput,
    user: AuthenticatedUser
  ): Promise<ListHistoriqueOutput> {
    const { collectiviteId } = input;

    const collectivitePrivate = await this.collectivites.isPrivate(
      collectiviteId
    );
    await this.permissions.isAllowed(
      user,
      collectivitePrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const { rows, total } = await this.listHistoriqueRepository.listHistorique(
      input
    );
    const hierarchies = await this.getHierarchies();
    const items: ListHistoriqueOutput['items'] = rows
      .map((row) => this.mapRowToItem(row, hierarchies))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { items, total };
  }

  /**
   * Convertit une ligne brute du `unionAll` en variante typée de
   * `HistoriqueItem`. Chaque branche ne renvoie que les champs pertinents
   * pour son `type`, conformément à l'union discriminée.
   *
   * Les invariants de non-nullité sur `actionId` et `questionId` sont
   * garantis par les tables sources (`historique.action_statut.action_id`
   * notNull, `historique.action_commentaire.action_id` notNull, et pour
   * `reponse`/`justification` la branche SQL projette le `question_id` non
   * nullable du verrou correspondant). Si la garantie SQL est néanmoins
   * violée (drift de schéma, vue cassée), on journalise et on filtre la
   * ligne plutôt que de propager un crash.
   */
  private mapRowToItem(
    row: HistoriqueUnionRow,
    hierarchies: HierarchiesByReferentielId
  ): ListHistoriqueOutput['items'][number] | null {
    const type = this.safeParseHistoriqueType(row.type);
    if (type === null) {
      return null;
    }
    const base = {
      collectiviteId: row.collectiviteId,
      modifiedById: row.modifiedById,
      modifiedByNom: row.modifiedByNom,
      modifiedAt: row.modifiedAt,
      previousModifiedById: row.previousModifiedById,
      previousModifiedAt: row.previousModifiedAt,
      actionIds: row.actionIds,
    };
    switch (type) {
      case 'action_statut':
      case 'action_precision': {
        const { actionId } = row;
        if (actionId === null) {
          this.logger.warn(
            `Ligne historique de type "${type}" sans actionId — ignorée`
          );
          return null;
        }
        const actionDescriptor = {
          actionId,
          actionType: this.safeGetActionType(actionId, hierarchies),
          actionIdentifiant: row.actionIdentifiant,
          actionNom: row.actionNom,
          tacheIdentifiant: row.tacheIdentifiant,
          tacheNom: row.tacheNom,
        };
        if (type === 'action_statut') {
          return {
            type,
            ...base,
            ...actionDescriptor,
            avancement: row.avancement,
            previousAvancement: row.previousAvancement,
            avancementDetaille: row.avancementDetaille,
            previousAvancementDetaille: row.previousAvancementDetaille,
            concerne: row.concerne,
            previousConcerne: row.previousConcerne,
          };
        }
        return {
          type,
          ...base,
          ...actionDescriptor,
          precision: row.precision,
          previousPrecision: row.previousPrecision,
        };
      }
      case 'reponse': {
        const { questionId, questionType } = row;
        if (questionId === null || questionType === null) {
          this.logger.warn(
            `Ligne historique de type "reponse" sans questionId/questionType — ignorée`
          );
          return null;
        }
        return {
          type,
          ...base,
          questionId,
          questionType,
          questionFormulation: row.questionFormulation,
          thematiqueId: row.thematiqueId,
          thematiqueNom: row.thematiqueNom,
          reponse: row.reponse,
          previousReponse: row.previousReponse,
          justification: row.justification,
        };
      }
      case 'justification': {
        const { questionId } = row;
        if (questionId === null) {
          this.logger.warn(
            `Ligne historique de type "justification" sans questionId — ignorée`
          );
          return null;
        }
        return {
          type,
          ...base,
          questionId,
          questionType: row.questionType,
          questionFormulation: row.questionFormulation,
          thematiqueId: row.thematiqueId,
          thematiqueNom: row.thematiqueNom,
          reponse: row.reponse,
          justification: row.justification,
          previousJustification: row.previousJustification,
        };
      }
    }
  }
}
