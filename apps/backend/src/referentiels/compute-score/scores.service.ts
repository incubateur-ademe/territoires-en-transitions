import { PreuveDto } from '@/backend/collectivites/documents/models/preuve.dto';
import DocumentService from '@/backend/collectivites/documents/services/document.service';
import { PersonnalisationReponsesPayload } from '@/backend/collectivites/personnalisations/models/get-personnalisation-reponses.response';
import { ActionDefinition } from '@/backend/referentiels/models/action-definition.table';
import { ScoreIndicatifPayload } from '@/backend/referentiels/models/score-indicatif.dto';
import { ScoreIndicatifService } from '@/backend/referentiels/score-indicatif/score-indicatif.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import {
  PermissionLevel,
  PermissionLevelEnum,
} from '@/backend/users/authorizations/roles/permission-level.enum';
import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  like,
  lte,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { chunk, isEqual, isNil, pick } from 'es-toolkit';
import { DateTime } from 'luxon';
import { CollectiviteAvecType } from '../../collectivites/identite-collectivite.dto';
import { PersonnalisationConsequencesByActionId } from '../../collectivites/personnalisations/models/personnalisation-consequence.dto';
import PersonnalisationsExpressionService from '../../collectivites/personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../../collectivites/personnalisations/services/personnalisations-service';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import {
  AuthenticatedUser,
  AuthUser as InternalAuthUser,
} from '../../users/models/auth.models';
import ConfigurationService from '../../utils/config/configuration.service';
import { DatabaseService } from '../../utils/database/database.service';
import MattermostNotificationService from '../../utils/mattermost-notification.service';
import { roundTo } from '../../utils/number.utils';
import { sleep } from '../../utils/sleep.utils';
import { CorrelatedActionsWithScoreFields } from '../correlated-actions/correlated-actions.dto';
import { CorrelatedActionWithScore } from '../correlated-actions/referentiel-action-origine-with-score.dto';
import { GetReferentielDefinitionService } from '../definitions/get-referentiel-definition/get-referentiel-definition.service';
import {
  GetReferentielService,
  ReferentielResponse,
} from '../get-referentiel/get-referentiel.service';
import { Audit } from '../labellisations/audit.table';
import { EtoileDefinition } from '../labellisations/etoile-definition.table';
import { LabellisationService } from '../labellisations/labellisation.service';
import { actionCommentaireTable } from '../models/action-commentaire.table';
import {
  ActionDefinitionEssential,
  TreeNode,
} from '../models/action-definition.dto';
import { ActionStatut, actionStatutTable } from '../models/action-statut.table';
import { ActionTypeEnum } from '../models/action-type.enum';
import { CheckMultipleReferentielScoresRequestType } from '../models/check-multiple-referentiel-scores.request';
import { CheckReferentielScoresRequestType } from '../models/check-referentiel-scores.request';
import { CheckScoreStatus } from '../models/check-score-status.enum';
import {
  clientScoresTable,
  ClientScoresType,
} from '../models/client-scores.table';
import { GetActionStatutExplicationsResponseType } from '../models/get-action-statut-explications.response';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { GetMultipleCheckScoresResponseType } from '../models/get-multiple-check-scores.response';
import { GetReferentielMultipleScoresRequestType } from '../models/get-referentiel-multiple-scores.request';
import { GetReferentielScoresRequestType } from '../models/get-referentiel-scores.request';
import { historiqueActionCommentaireTable } from '../models/historique-action-commentaire.table';
import { historiqueActionStatutTable } from '../models/historique-action-statut.table';
import { ReferentielId } from '../models/referentiel-id.enum';
import { getParentIdFromActionId } from '../referentiels.utils';
import { ScoresPayload } from '../snapshots/scores-payload.dto';
import { SnapshotJalonEnum } from '../snapshots/snapshot-jalon.enum';
import { ActionStatutsByActionId } from './action-statuts-by-action-id.dto';
import {
  Score,
  ScoreFields,
  ScoreFinalFields,
  ScoresByActionId,
  ScoreWithOnlyPoints,
  ScoreWithOnlyPointsAndStatuts,
} from './score.dto';

type ActionWithScore = TreeNode<ActionDefinitionEssential & ScoreFields>;

@Injectable()
export default class ScoresService {
  private readonly logger = new Logger(ScoresService.name);

  private static DEFAULT_ROUNDING_DIGITS = 3;
  private static MULTIPLE_COLLECTIVITE_CHUNK_SIZE = 10;

  constructor(
    private readonly permissionService: PermissionService,
    private readonly configService: ConfigurationService,
    private readonly mattermostNotificationService: MattermostNotificationService,
    private readonly collectivitesService: CollectivitesService,
    private readonly databaseService: DatabaseService,
    private readonly getReferentielsService: GetReferentielService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly personnalisationService: PersonnalisationsService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly labellisationService: LabellisationService,
    private readonly documentService: DocumentService,
    private readonly scoreIndicatifService: ScoreIndicatifService
  ) {}

  private async checkCollectiviteAndReferentielWithAccess(
    collectiviteId: number,
    referentielId: ReferentielId,
    tokenInfo?: InternalAuthUser,
    niveauAccesMinimum = PermissionLevelEnum.LECTURE
  ): Promise<CollectiviteAvecType> {
    // Check read access if a date is given (historical data)
    if (tokenInfo) {
      await this.permissionService.isAllowed(
        tokenInfo,
        niveauAccesMinimum === PermissionLevelEnum.LECTURE
          ? PermissionOperationEnum['REFERENTIELS.LECTURE']
          : PermissionOperationEnum['REFERENTIELS.EDITION'],
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }
    await this.getReferentielDefinitionService.getReferentielDefinition(
      referentielId
    );

    return this.collectivitesService.getCollectiviteAvecType(collectiviteId);
  }

  private buildActionWithScore(
    action: TreeNode<
      ActionDefinitionEssential &
        Partial<ScoreFields> &
        CorrelatedActionsWithScoreFields
    >,
    actionStatutExplications?: GetActionStatutExplicationsResponseType,
    actionPreuves?: { [actionId: string]: PreuveDto[] },
    fillOrigineActionMap?: {
      [origineActionId: string]: CorrelatedActionWithScore;
    },
    existingScores?: ScoresByActionId
  ): TreeNode<
    ActionDefinitionEssential &
      CorrelatedActionsWithScoreFields &
      ScoreFinalFields
  > {
    const actionId = action.actionId;

    const score =
      existingScores && existingScores[actionId]
        ? existingScores[actionId]
        : ({
            actionId: actionId,
            pointReferentiel: !isNil(action.points) ? action.points : null,
            pointPotentiel: null,
            pointPotentielPerso: null,
            pointFait: null,
            pointPasFait: null,
            pointNonRenseigne: null,
            pointProgramme: null,
            concerne: true,
            completedTachesCount: null,
            totalTachesCount: 1,
            faitTachesAvancement: null,
            programmeTachesAvancement: null,
            pasFaitTachesAvancement: null,
            pasConcerneTachesAvancement: null,
            desactive: false,
            renseigne: true,
          } as Score);

    const actionWithScore: TreeNode<
      ActionDefinitionEssential & ScoreFields & CorrelatedActionsWithScoreFields
    > = {
      ...action,
      score,
      actionsEnfant: [],
      actionsOrigine: [],
      scoresTag: {},
    };

    if (actionStatutExplications && actionStatutExplications[actionId]) {
      actionWithScore.score.explication =
        actionStatutExplications[actionId].explication;
    }

    if (actionPreuves && actionPreuves[actionId]) {
      actionWithScore.preuves = actionPreuves[actionId].map((preuve) => {
        const simplePreuve = pick(preuve, [
          'titre',
          'commentaire',
          'url',
          'preuveType',
          'preuveId',
          'fichierId',
          'filename',
          'modifiedAt',
          'confidentiel',
        ]);

        return simplePreuve;
      });
    }

    if (!action.actionsOrigine) {
      delete actionWithScore.actionsOrigine;
    }

    action.actionsEnfant.forEach((actionEnfant) => {
      // Examples are not included in the score
      if (actionEnfant.actionType !== ActionTypeEnum.EXEMPLE) {
        const actionEnfantAvecScore = this.buildActionWithScore(
          actionEnfant,
          actionStatutExplications,
          actionPreuves,
          fillOrigineActionMap,
          existingScores
        );
        actionWithScore.actionsEnfant.push(actionEnfantAvecScore);
      }
    });

    if (action.actionsOrigine) {
      actionWithScore.actionsOrigine = action.actionsOrigine.map(
        (actionOrigine) => {
          // TODO: only for level sous-action?
          // WARNING: an action origin can be used several times be sure to not overwrite it in the map
          const actionOrigineWithScore: CorrelatedActionWithScore =
            (fillOrigineActionMap &&
              fillOrigineActionMap[actionOrigine.actionId]) || {
              ...actionOrigine,
              score: null,
            };
          if (fillOrigineActionMap) {
            fillOrigineActionMap[actionOrigine.actionId] =
              actionOrigineWithScore;
          }

          return actionOrigineWithScore;
        }
      );
    }

    const totalTachesCount = actionWithScore.actionsEnfant.length
      ? actionWithScore.actionsEnfant.reduce(
          (acc, enfant) => acc + (enfant.score.totalTachesCount || 1),
          0
        )
      : 1;
    actionWithScore.score.totalTachesCount = totalTachesCount;

    return actionWithScore as TreeNode<
      ActionDefinitionEssential & ScoreFinalFields
    >;
  }

  private appliquePersonnalisationPotentielPerso(
    action: TreeNode<ActionDefinitionEssential & ScoreFinalFields>,
    personnalisationConsequences: PersonnalisationConsequencesByActionId,
    potentielPerso?: number
  ) {
    let recursivePotentielPerso = potentielPerso;
    const actionPersonnalisationConsequences =
      personnalisationConsequences[action.actionId];

    // Si il y a un potentiel perso on l'applique et on le propagera aux enfants
    if (!isNil(actionPersonnalisationConsequences?.potentielPerso)) {
      recursivePotentielPerso =
        actionPersonnalisationConsequences.potentielPerso *
        (potentielPerso || 1);
      action.score.pointPotentielPerso =
        recursivePotentielPerso * (action.score.pointReferentiel || 0);
    }

    if (!isNil(recursivePotentielPerso) && action.score.pointReferentiel) {
      action.score.pointPotentiel =
        recursivePotentielPerso * action.score.pointReferentiel;
    }

    action.actionsEnfant.forEach((actionEnfant) => {
      this.appliquePersonnalisationPotentielPerso(
        actionEnfant,
        personnalisationConsequences,
        recursivePotentielPerso
      );
    });

    // Maintenant qu'on l'a appliqué aux enfants, on recalcule le potentiel perso du parent s'il n'a pas déjà été calculé
    if (isNil(action.score.pointPotentiel)) {
      if (action.actionsEnfant.length) {
        action.score.pointPotentiel = action.actionsEnfant.reduce(
          (acc, enfant) => {
            if (isNil(enfant.score.pointPotentiel)) {
              return acc + (enfant.score.pointReferentiel || 0);
            }
            return acc + enfant.score.pointPotentiel;
          },
          0
        );
      } else {
        action.score.pointPotentiel = action.score.pointReferentiel || 0;
      }
    }
  }

  private appliquePersonnalisationDesactivation(
    referentielActionAvecScore: TreeNode<
      ActionDefinitionEssential & ScoreFinalFields
    >,
    personnalisationConsequences: PersonnalisationConsequencesByActionId,
    setPotentielPersoToZero = false,
    parentDesactivation?: boolean
  ) {
    const actionPersonnalisationConsequences =
      personnalisationConsequences[referentielActionAvecScore.actionId];
    // Si le parent n'est pas déjà désactivé et il y a une desactivation on l'applique et on le propagera aux enfants
    if (!parentDesactivation && actionPersonnalisationConsequences?.desactive) {
      parentDesactivation = actionPersonnalisationConsequences?.desactive;
    }
    referentielActionAvecScore.score.desactive = parentDesactivation || false;
    if (referentielActionAvecScore.score.desactive) {
      // Si l'action est désactivée, on place le flag concerné à false
      referentielActionAvecScore.score.concerne = false;
      if (setPotentielPersoToZero) {
        referentielActionAvecScore.score.pointPotentiel = 0;
      }
    }

    referentielActionAvecScore.actionsEnfant.forEach((actionEnfant) => {
      this.appliquePersonnalisationDesactivation(
        actionEnfant,
        personnalisationConsequences,
        setPotentielPersoToZero,
        parentDesactivation
      );
    });
  }

  private appliqueActionStatutNonConcerneEtRemonteAuxParents(
    referentielActionAvecScore: TreeNode<
      ActionDefinitionEssential & ScoreFinalFields
    >,
    actionStatuts: ActionStatutsByActionId,
    parentConcerne = true
  ) {
    const actionStatut = actionStatuts[referentielActionAvecScore.actionId];
    if (actionStatut) {
      referentielActionAvecScore.score.aStatut = true;
      referentielActionAvecScore.score.avancement = actionStatut.avancement;
    }

    // Si le parent n'est pas déjà désactivé et il y a une desactivation on l'applique et on le propagera aux enfants
    if (parentConcerne && actionStatut && !actionStatut.concerne) {
      parentConcerne = actionStatut.concerne;
    }

    // On applique parent concerne que si il est à faut
    // Ceci afin d'éviter de réactiver une action qui a été désactivée par une règle de personnalisation
    if (!parentConcerne) {
      referentielActionAvecScore.score.concerne = parentConcerne;
    }

    referentielActionAvecScore.actionsEnfant.forEach((actionEnfant) => {
      this.appliqueActionStatutNonConcerneEtRemonteAuxParents(
        actionEnfant,
        actionStatuts,
        parentConcerne
      );
    });

    // Maintant qu'on l'a appliqué aux enfants, on remonte aux parents
    // Si tous ces enfants sont non concernés, alors il est non concerné
    if (
      !actionStatut?.concerne &&
      referentielActionAvecScore.actionsEnfant.length &&
      referentielActionAvecScore.actionsEnfant.every(
        (enfant) => !enfant.score.concerne
      )
    ) {
      this.logger.log(
        `Tous les enfants de ${referentielActionAvecScore.actionId} sont non concernés, donc il est non concerné`
      );
      referentielActionAvecScore.score.concerne = false;
    }
  }

  private redistribuePotentielActionsDesactiveesNonConcerneesEtRecalculePotentielParent(
    action: TreeNode<ActionDefinitionEssential & ScoreFinalFields>,
    actionLevel: number,
    disablePotentielRedistribution: boolean
  ) {
    // Appelle recursif sur les enfants pour commencer par le bas de l'arbre
    action.actionsEnfant.forEach((actionEnfant) => {
      this.redistribuePotentielActionsDesactiveesNonConcerneesEtRecalculePotentielParent(
        actionEnfant,
        actionLevel,
        disablePotentielRedistribution
      );
    });

    if (!action.score.concerne) {
      // WARNING: on ne peut pas encore le mettre à 0 car on doit redistribuer les points
      //referentielActionAvecScore.score.point_potentiel = 0;
    } else {
      if (!disablePotentielRedistribution) {
        // On ne redistribue que pour les enfants de type sous-actions et taches
        // Autrement dit, que pour un parent au moins de type action
        if (action.level >= actionLevel) {
          // On ne redistribue qu'aux actions concernées et qui n'ont pas un potentiel à 0'
          const enfantsConcernes: typeof action.actionsEnfant = [];
          action.actionsEnfant.forEach((enfant) => {
            if (enfant.score.concerne) {
              if (enfant.score.pointPotentiel) {
                enfantsConcernes.push(enfant);
              }
            }
          });

          if (enfantsConcernes.length) {
            const pointsARedistribuer = action.actionsEnfant.reduce(
              (acc, enfant) => {
                if (!enfant.score.concerne) {
                  const actionPointARedistribuer =
                    enfant.score.pointPotentiel || 0;
                  return acc + actionPointARedistribuer;
                }
                return acc;
              },
              0
            );

            const pointsParEnfant =
              pointsARedistribuer / enfantsConcernes.length;
            /*this.logger.log(
            `Points à redistribuer pour les ${enfantsConcernes.length} enfants actifs (sur ${referentielActionAvecScore.actions_enfant.length}) de l'action ${referentielActionAvecScore.action_id}: ${pointsParEnfant}`,
          );*/
            enfantsConcernes.forEach((enfant) => {
              if (isNil(enfant.score.pointPotentiel)) {
                this.logger.warn(
                  `Potentiel non renseigné pour ${enfant.actionId}, ne devrait pas être le cas à cette étape`
                );
                enfant.score.pointPotentiel =
                  enfant.score.pointReferentiel || 0;
              }
              const nouveauPotentiel =
                enfant.score.pointPotentiel + pointsParEnfant;
              const redistributionFactor =
                nouveauPotentiel / enfant.score.pointPotentiel;
              this.appliqueRedistributionPotentiel(
                enfant,
                redistributionFactor
              );
            });
          } else {
            // TODO: que doit-on faire ?
          }
        }
      }

      // On met à jour le potentiel du parent
      if (action.actionsEnfant.length) {
        // Exception si sous-action qui a été marquée explicitementcomme concernée et dont tous les enfants on été mis comme nonconcernés
        const enfantsConcernes = action.actionsEnfant.filter(
          (enfant) => enfant.score.concerne
        ).length;
        if (
          action.score.aStatut &&
          action.score.concerne &&
          !enfantsConcernes
        ) {
          this.logger.warn(
            `Action ${action.actionId} a un statut concerné mais tous ses enfants sont non concernés`
          );
        } else {
          const potentielParent = action.actionsEnfant.reduce(
            (acc, enfant) =>
              acc +
              (enfant.score.concerne ? enfant.score.pointPotentiel || 0 : 0),
            0
          );
          action.score.pointPotentiel = potentielParent;
        }
      }
    }
  }

  private appliqueRedistributionPotentiel(
    referentielActionAvecScore: ActionWithScore,
    redistributionFactor: number
  ) {
    referentielActionAvecScore.score.pointPotentiel =
      referentielActionAvecScore.score.pointPotentiel! * redistributionFactor;
    referentielActionAvecScore.actionsEnfant.forEach((actionEnfant) => {
      this.appliqueRedistributionPotentiel(actionEnfant, redistributionFactor);
    });
  }

  private appliqueActionAvancementEtRemonteAuxParents(
    referentielActionAvecScore: TreeNode<
      ActionDefinitionEssential & ScoreFinalFields
    >,
    actionStatuts: ActionStatutsByActionId
  ) {
    referentielActionAvecScore.actionsEnfant.forEach((actionEnfant) => {
      this.appliqueActionAvancementEtRemonteAuxParents(
        actionEnfant,
        actionStatuts
      );
    });

    // voir fonction update_action_scores_from_status
    if (!referentielActionAvecScore.score.concerne) {
      // Attention dans le python pasConcerneTachesAvancement, completedTachesCount et totalTachesCount sont mal géré dans ce cas là
      // la fonction leaf_count est utilisée qui donne le nombre d'enfant directs qui sont des feuilles ou 1 si il y en a pas
      // En conséquence, completedTachesCount et totalTachesCount sont à 1 dès qu'on est au niveau d'une action ou au dessus (sous-axe, axe)

      // Fait comme le python pour l'instant, le temps de valider le moteur
      // TODO: à supprimer une fois le moteur validé > à remplacer par referentielActionAvecScore.score.totalTachesCount
      const tachesCount =
        referentielActionAvecScore.actionsEnfant.filter(
          (actionEnfant) => !actionEnfant.actionsEnfant?.length
        ).length || 1;

      referentielActionAvecScore.score.pointFait = 0;
      referentielActionAvecScore.score.pointPasFait = 0;
      referentielActionAvecScore.score.pointProgramme = 0;
      referentielActionAvecScore.score.pointPotentiel = 0;
      referentielActionAvecScore.score.pointNonRenseigne = 0;
      referentielActionAvecScore.score.completedTachesCount = tachesCount;
      referentielActionAvecScore.score.totalTachesCount = tachesCount;
      referentielActionAvecScore.score.faitTachesAvancement = 0;
      referentielActionAvecScore.score.programmeTachesAvancement = 0;
      referentielActionAvecScore.score.pasFaitTachesAvancement = 0;
      referentielActionAvecScore.score.pasConcerneTachesAvancement =
        tachesCount;
      referentielActionAvecScore.score.renseigne = true;
      /* todo:
            point_potentiel_perso=tache_points_personnalise
            if is_personnalise and not is_desactive
            else None,
            */
    } else {
      const actionStatut = actionStatuts[referentielActionAvecScore.actionId];
      if (actionStatut) {
        referentielActionAvecScore.score.aStatut = true;
        referentielActionAvecScore.score.avancement = actionStatut.avancement;
      }

      if (
        actionStatut &&
        actionStatut.avancement !== 'non_renseigne' &&
        actionStatut.avancementDetaille?.length === 3
      ) {
        const pointsPotentiel =
          referentielActionAvecScore.score.pointPotentiel || 0;
        const pourcentageFait = actionStatut.avancementDetaille[0];
        const pourcentageProgramme = actionStatut.avancementDetaille[1];
        const pourcentagePasFait = actionStatut.avancementDetaille[2];
        referentielActionAvecScore.score.pointFait =
          pourcentageFait * pointsPotentiel;
        referentielActionAvecScore.score.pointPasFait =
          pourcentagePasFait * pointsPotentiel;
        referentielActionAvecScore.score.pointProgramme =
          pourcentageProgramme * pointsPotentiel;
        referentielActionAvecScore.score.pointNonRenseigne = 0;
        referentielActionAvecScore.score.completedTachesCount =
          referentielActionAvecScore.score.totalTachesCount;
        referentielActionAvecScore.score.faitTachesAvancement =
          pourcentageFait * referentielActionAvecScore.score.totalTachesCount;
        referentielActionAvecScore.score.programmeTachesAvancement =
          pourcentageProgramme *
          referentielActionAvecScore.score.totalTachesCount;
        referentielActionAvecScore.score.pasFaitTachesAvancement =
          pourcentagePasFait *
          referentielActionAvecScore.score.totalTachesCount;
        referentielActionAvecScore.score.pasConcerneTachesAvancement = 0;
        referentielActionAvecScore.score.renseigne = true;

        // Il s'agit d'une tache sans statut, tous les points sont non renseignés
      } else if (!referentielActionAvecScore.actionsEnfant?.length) {
        referentielActionAvecScore.score.pointFait = 0;
        referentielActionAvecScore.score.pointPasFait = 0;
        referentielActionAvecScore.score.pointProgramme = 0;
        referentielActionAvecScore.score.pointNonRenseigne =
          referentielActionAvecScore.score.pointPotentiel;
        referentielActionAvecScore.score.completedTachesCount = 0;
        referentielActionAvecScore.score.faitTachesAvancement = 0;
        referentielActionAvecScore.score.programmeTachesAvancement = 0;
        referentielActionAvecScore.score.pasFaitTachesAvancement = 0;
        referentielActionAvecScore.score.pasConcerneTachesAvancement = 0;
        referentielActionAvecScore.score.renseigne = false;
      } else {
        this.mergeScoresEnfants(
          referentielActionAvecScore.score,
          referentielActionAvecScore.actionsEnfant.map((enfant) => enfant.score)
        );
      }
    }
  }

  private mergePointScoresEnfants(
    scoreParent: ScoreWithOnlyPoints,
    scoreEnfants: ScoreWithOnlyPoints[],
    includePointPotentielAndReferentiel = false,
    roundingDigits: number | undefined = undefined
  ) {
    // only focus on point properties
    const pointPasFait = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pointPasFait || 0),
      0
    );
    scoreParent.pointPasFait =
      roundingDigits !== undefined
        ? roundTo(pointPasFait, roundingDigits)
        : pointPasFait;

    const pointFait = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pointFait || 0),
      0
    );
    scoreParent.pointFait =
      roundingDigits !== undefined
        ? roundTo(pointFait, roundingDigits)
        : pointFait;

    const pointProgramme = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pointProgramme || 0),
      0
    );
    scoreParent.pointProgramme =
      roundingDigits !== undefined
        ? roundTo(pointProgramme, roundingDigits)
        : pointProgramme;

    const pointNonRenseigne = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pointNonRenseigne || 0),
      0
    );
    scoreParent.pointNonRenseigne =
      roundingDigits !== undefined
        ? roundTo(pointNonRenseigne, roundingDigits)
        : pointNonRenseigne;

    if (includePointPotentielAndReferentiel) {
      const pointPotentiel = scoreEnfants.reduce(
        (acc, enfant) => acc + (enfant.pointPotentiel || 0),
        0
      );
      scoreParent.pointPotentiel =
        roundingDigits !== undefined
          ? roundTo(pointPotentiel, roundingDigits)
          : pointPotentiel;

      const pointReferentiel = scoreEnfants.reduce(
        (acc, enfant) => acc + (enfant.pointReferentiel || 0),
        0
      );
      scoreParent.pointReferentiel =
        roundingDigits !== undefined
          ? roundTo(pointReferentiel, roundingDigits)
          : pointReferentiel;
    }
  }

  private mergeScoresEnfants(scoreParent: Score, scoreEnfants: Score[]) {
    this.mergePointScoresEnfants(scoreParent, scoreEnfants);

    // TODO: supprimer ce recalcul du totalTachesCount une fois le moteur validé
    // lié à un bug python
    scoreParent.totalTachesCount = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.totalTachesCount || 1),
      0
    );

    scoreParent.completedTachesCount = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.completedTachesCount || 0),
      0
    );
    scoreParent.faitTachesAvancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.faitTachesAvancement || 0),
      0
    );
    scoreParent.programmeTachesAvancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.programmeTachesAvancement || 0),
      0
    );
    scoreParent.pasFaitTachesAvancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pasFaitTachesAvancement || 0),
      0
    );
    scoreParent.pasConcerneTachesAvancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pasConcerneTachesAvancement || 0),
      0
    );
    if (
      scoreParent.concerne &&
      scoreParent.pointNonRenseigne &&
      scoreParent.pointNonRenseigne > 0
    ) {
      scoreParent.renseigne = false;
    }
  }

  private appliquePersonnalisationScore(
    action: TreeNode<ActionDefinitionEssential & ScoreFinalFields>,
    personnalisationConsequences: PersonnalisationConsequencesByActionId,
    scoreMap: { [key: string]: number },
    overridenScoreFactor?: number
  ) {
    const actionPersonnalisationConsequences =
      personnalisationConsequences[action.actionId];
    // Si il y a un potentiel perso on l'applique et on le propagera aux enfants
    if (
      !isNil(actionPersonnalisationConsequences?.scoreFormule) &&
      action.score.pointPotentiel // if point_potentiel equals 0., no worthy reduction
    ) {
      const originalScore = scoreMap[action.actionId];
      const overridenScore =
        this.personnalisationsExpressionService.parseAndEvaluateExpression(
          actionPersonnalisationConsequences.scoreFormule,
          null,
          null,
          scoreMap
        ) as number;

      if (!isNil(overridenScore) && originalScore > 0) {
        overridenScoreFactor = overridenScore / originalScore;
      }
    }

    if (!isNil(overridenScoreFactor)) {
      action.score.pointFait =
        (action.score.pointFait || 0) * overridenScoreFactor;
    }

    action.actionsEnfant.forEach((actionEnfant) => {
      this.appliquePersonnalisationScore(
        actionEnfant,
        personnalisationConsequences,
        scoreMap,
        overridenScoreFactor
      );
    });

    // Maintenant qu'on a appliqué aux enfants, on reactualise les points des parents
    if (action.actionsEnfant.length) {
      // Lorsque le statut d'un parent est renseigné, il prévaut sur la somme de ses enfants
      // Un peu étrange mais uniquement conservé pour conserver le statut des enfants
      if (!action.score.aStatut) {
        action.score.pointFait = action.actionsEnfant.reduce(
          (acc, enfant) => acc + (enfant.score.pointFait || 0),
          0
        );
      }
    }
  }

  private computeEtoiles(
    action: ActionWithScore,
    etoilesDefinition: EtoileDefinition[],
    recursive = false
  ) {
    // Compute etoiles only for root level by default
    if (recursive) {
      action.actionsEnfant.forEach((actionEnfant) => {
        this.computeEtoiles(actionEnfant, etoilesDefinition);
      });
    }

    //
    this.fillEtoilesInScore(action.score, etoilesDefinition);
  }

  private fillEtoilesInScore(
    score: Score,
    etoilesDefinition: EtoileDefinition[]
  ) {
    // WARNING the etoiles definition is supposed to have been sorted by minRealisePercentage desc
    for (const etoileDefinition of etoilesDefinition) {
      const scorePercentage = score.pointPotentiel
        ? ((score.pointFait || 0) * 100) / score.pointPotentiel
        : 0;
      if (scorePercentage >= etoileDefinition.minRealisePercentage) {
        score.etoiles = etoileDefinition.etoile;
        break;
      }
    }
  }

  private appliqueRounding(
    referentielActionAvecScore: ActionWithScore,
    ndigits: number = ScoresService.DEFAULT_ROUNDING_DIGITS
  ) {
    referentielActionAvecScore.actionsEnfant.forEach((actionEnfant) => {
      this.appliqueRounding(actionEnfant, ndigits);
    });

    referentielActionAvecScore.score.pointPotentiel =
      referentielActionAvecScore.score.pointPotentiel !== null
        ? roundTo(referentielActionAvecScore.score.pointPotentiel, ndigits)
        : null;
    referentielActionAvecScore.score.pointFait =
      referentielActionAvecScore.score.pointFait !== null
        ? roundTo(referentielActionAvecScore.score.pointFait, ndigits)
        : null;
    referentielActionAvecScore.score.pointProgramme =
      referentielActionAvecScore.score.pointProgramme !== null
        ? roundTo(referentielActionAvecScore.score.pointProgramme, ndigits)
        : null;
    referentielActionAvecScore.score.pointNonRenseigne =
      referentielActionAvecScore.score.pointNonRenseigne !== null
        ? roundTo(referentielActionAvecScore.score.pointNonRenseigne, ndigits)
        : null;
    referentielActionAvecScore.score.pointPasFait =
      referentielActionAvecScore.score.pointPasFait !== null
        ? roundTo(referentielActionAvecScore.score.pointPasFait, ndigits)
        : null;
    referentielActionAvecScore.score.pointReferentiel =
      referentielActionAvecScore.score.pointReferentiel !== null
        ? roundTo(referentielActionAvecScore.score.pointReferentiel, ndigits)
        : null;
    if (referentielActionAvecScore.score.pointPotentielPerso) {
      referentielActionAvecScore.score.pointPotentielPerso =
        roundTo(
          referentielActionAvecScore.score.pointPotentielPerso,
          ndigits
        ) || null;
    }
    referentielActionAvecScore.score.faitTachesAvancement =
      referentielActionAvecScore.score.faitTachesAvancement !== null
        ? roundTo(
            referentielActionAvecScore.score.faitTachesAvancement,
            ndigits
          )
        : null;
    referentielActionAvecScore.score.pasFaitTachesAvancement =
      referentielActionAvecScore.score.pasFaitTachesAvancement !== null
        ? roundTo(
            referentielActionAvecScore.score.pasFaitTachesAvancement,
            ndigits
          )
        : null;
    referentielActionAvecScore.score.programmeTachesAvancement =
      referentielActionAvecScore.score.programmeTachesAvancement !== null
        ? roundTo(
            referentielActionAvecScore.score.programmeTachesAvancement,
            ndigits
          )
        : null;
    referentielActionAvecScore.score.pasConcerneTachesAvancement =
      referentielActionAvecScore.score.pasConcerneTachesAvancement !== null
        ? roundTo(
            referentielActionAvecScore.score.pasConcerneTachesAvancement,
            ndigits
          )
        : null;
  }

  private fillAvancementDetailleFromAvancement(
    actionStatut: Pick<ActionStatut, 'avancement' | 'avancementDetaille'>
  ) {
    if (actionStatut.avancement === 'fait') {
      actionStatut.avancementDetaille = [1, 0, 0];
    } else if (actionStatut.avancement === 'programme') {
      actionStatut.avancementDetaille = [0, 1, 0];
    } else if (actionStatut.avancement === 'pas_fait') {
      actionStatut.avancementDetaille = [0, 0, 1];
    } else if (!actionStatut.avancementDetaille) {
      actionStatut.avancementDetaille = [0, 0, 0];
    }
  }

  async getReferentielActionStatuts(
    referentielId: ReferentielId,
    collectiviteId: number,
    date?: string,
    tokenInfo?: AuthenticatedUser,
    noCheck?: boolean
  ): Promise<ActionStatutsByActionId> {
    const getActionStatuts: ActionStatutsByActionId = {};

    this.logger.log(
      `Getting collectivite ${collectiviteId} action statuts for referentiel ${referentielId} and date ${date}`
    );

    // No check if no date is defined: allowed for anonymous access
    if (!noCheck) {
      await this.checkCollectiviteAndReferentielWithAccess(
        collectiviteId,
        referentielId,
        date ? tokenInfo : undefined
      );
    }

    const table = date ? historiqueActionStatutTable : actionStatutTable;

    const actionStatutsConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectiviteId, collectiviteId),
      like(table.actionId, `${referentielId}%`),
    ];
    if (date) {
      actionStatutsConditions.push(lte(table.modifiedAt, date));
    }
    // TODO: colonne referentiel dans les actionStatutTable ?
    const referentielActionStatuts = await this.databaseService.db
      .select()
      .from(table)
      .where(and(...actionStatutsConditions))
      .orderBy(desc(table.modifiedAt), asc(table.actionId));
    this.logger.log(
      `${referentielActionStatuts.length} statuts trouves pour le referentiel ${referentielId} et la collectivite ${collectiviteId}`
    );
    this.logger.log(
      `Dernière modification de statut: ${
        referentielActionStatuts.length
          ? referentielActionStatuts[0]?.modifiedAt
          : 'N/A'
      }`
    );
    referentielActionStatuts.forEach((actionStatut) => {
      if (!getActionStatuts[actionStatut.actionId]) {
        getActionStatuts[actionStatut.actionId] = actionStatut;
        this.fillAvancementDetailleFromAvancement(actionStatut);
      } else {
        // On ne garde que le dernier statut, déjà pris en compte par l'orderBy
      }
    });

    return getActionStatuts;
  }

  // Called explications to differentiate from discussion commentaire
  private async getReferentielActionStatutExplications(
    referentielId: ReferentielId,
    collectiviteId: number,
    date?: string,
    tokenInfo?: InternalAuthUser,
    noCheck?: boolean
  ): Promise<GetActionStatutExplicationsResponseType> {
    const getActionStatutsExplications: GetActionStatutExplicationsResponseType =
      {};

    this.logger.log(
      `Getting collectivite ${collectiviteId} action statut explications for referentiel ${referentielId} and date ${date}`
    );

    // // No check if no date is defined, allowed for anonymous access
    if (!noCheck && date) {
      await this.checkCollectiviteAndReferentielWithAccess(
        collectiviteId,
        referentielId,
        tokenInfo
      );
    }

    const table = date
      ? historiqueActionCommentaireTable
      : actionCommentaireTable;

    const actionStatutsConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectiviteId, collectiviteId),
      like(table.actionId, `${referentielId}%`),
    ];
    if (date) {
      actionStatutsConditions.push(lte(table.modifiedAt, date));
    }
    // TODO: colonne referentiel dans les actionStatutTable ?
    const referentielActionStatutExplications = await this.databaseService.db
      .select({
        actionId: table.actionId,
        explication: date
          ? historiqueActionCommentaireTable.precision
          : actionCommentaireTable.commentaire,
        modifiedAt: table.modifiedAt,
      })
      .from(table)
      .where(and(...actionStatutsConditions))
      .orderBy(desc(table.modifiedAt), asc(table.actionId));
    this.logger.log(
      `${referentielActionStatutExplications.length} action statut explications trouves pour le referentiel ${referentielId} et la collectivite ${collectiviteId}`
    );
    this.logger.log(
      `Dernière modification de statut: ${
        referentielActionStatutExplications.length
          ? referentielActionStatutExplications[0]?.modifiedAt
          : 'N/A'
      }`
    );
    referentielActionStatutExplications.forEach((actionStatutExplication) => {
      if (!getActionStatutsExplications[actionStatutExplication.actionId]) {
        getActionStatutsExplications[actionStatutExplication.actionId] = {
          explication: actionStatutExplication.explication,
        };
      } else {
        // On ne garde que la dernière explication, déjà pris en compte par l'orderBy
      }
    });

    return getActionStatutsExplications;
  }

  private getActionPointScore(actionScore: Score): ScoreWithOnlyPoints | null {
    if (actionScore) {
      const actionPointScore: ScoreWithOnlyPoints = {
        pointPotentiel: actionScore.pointPotentiel || 0,
        pointFait: actionScore.pointFait || 0,
        pointProgramme: actionScore.pointProgramme || 0,
        pointPasFait: actionScore.pointPasFait || 0,
        pointNonRenseigne: actionScore.pointNonRenseigne || 0,
        pointReferentiel: actionScore.pointReferentiel || 0,
      };
      if (!isNil(actionScore.etoiles)) {
        actionPointScore.etoiles = actionScore.etoiles;
      }
      return actionPointScore;
    }
    return null;
  }

  private getActionPointScoreWithAvancement(
    actionScore: Score
  ): ScoreWithOnlyPointsAndStatuts | null {
    const actionPointScore = this.getActionPointScore(actionScore);
    if (actionPointScore) {
      const actionPointScoreWithAvancement: ScoreWithOnlyPointsAndStatuts = {
        ...actionPointScore,
        totalTachesCount: actionScore.totalTachesCount || 0,
        faitTachesAvancement: actionScore.faitTachesAvancement || 0,
        programmeTachesAvancement: actionScore.programmeTachesAvancement || 0,
        pasFaitTachesAvancement: actionScore.pasFaitTachesAvancement || 0,
        pasConcerneTachesAvancement:
          actionScore.pasConcerneTachesAvancement || 0,
      };
      return actionPointScoreWithAvancement;
    }
    return null;
  }

  async computeScoreForMultipleCollectivite(
    referentielId: ReferentielId,
    parameters: GetReferentielMultipleScoresRequestType,
    tokenInfo?: AuthenticatedUser
  ): Promise<{
    referentielVersion: string;
    collectiviteScores: ScoresPayload[];
  }> {
    this.logger.log(
      `Calcul des scores pour les collectivités ${parameters.collectiviteIds.join(
        ','
      )} pour le referentiel ${referentielId} à la date ${
        parameters.date
      } (Depuis referentiels origine: ${parameters.avecReferentielsOrigine})`
    );

    const referentiel = await this.getReferentielsService.getReferentielTree(
      referentielId,
      true,
      parameters.avecReferentielsOrigine
    );

    const getReferentielMultipleScoresResponse = {
      referentielVersion: referentiel.version,
      collectiviteScores: [] as ScoresPayload[],
    };

    const collectiviteChunks = chunk(
      parameters.collectiviteIds,
      ScoresService.MULTIPLE_COLLECTIVITE_CHUNK_SIZE
    );
    for (const collectiviteChunk of collectiviteChunks) {
      const collectiviteScores = await Promise.all(
        collectiviteChunk.map((collectiviteId) =>
          this.computeScoreForCollectivite(
            referentielId,
            collectiviteId,
            parameters,
            tokenInfo,
            referentiel,
            true
          ).then((result) => result.scoresPayload)
        )
      );
      getReferentielMultipleScoresResponse.collectiviteScores.push(
        ...collectiviteScores
      );
    }

    return getReferentielMultipleScoresResponse;
  }

  async computeScoreForCollectivite(
    referentielId: ReferentielId,
    collectiviteId: number,
    parameters: GetReferentielScoresRequestType,
    user?: InternalAuthUser,
    referentiel?: ReferentielResponse,
    noCheck?: boolean
  ): Promise<{
    scoresPayload: ScoresPayload;
    personnalisationReponsesPayload: PersonnalisationReponsesPayload;
  }> {
    this.logger.log(
      `Calcul du score  de la collectivité ${collectiviteId} pour le referentiel ${referentielId} à la date ${parameters.date} et pour le jalon ${parameters.jalon} (Depuis referentiels origine: ${parameters.avecReferentielsOrigine})`
    );
    let auditId: number | undefined = undefined;
    if (parameters.jalon) {
      if (parameters.date) {
        throw new HttpException(
          `Une date ne doit pas être définie lorsqu'un jalon est spécifié`,
          400
        );
      }
      // Later we can have snapshots for other jalon
      if (
        (parameters.jalon === SnapshotJalonEnum.PRE_AUDIT ||
          parameters.jalon === SnapshotJalonEnum.POST_AUDIT) &&
        !parameters.avecReferentielsOrigine
      ) {
        const audits = await this.labellisationService.listAudits({
          collectiviteId,
          referentielId,
        });

        if (!audits.length) {
          throw new HttpException(
            `Aucun audit trouvé pour la collectivité ${collectiviteId} (auditId: ${parameters.auditId})`,
            400
          );
        }

        // Audits are sorted by date desc
        let audit: Audit | undefined = audits[0];
        if (parameters.anneeAudit) {
          audit = audits.find(
            (a) =>
              a.dateFin &&
              (DateTime.fromISO(a.dateFin).year === parameters.anneeAudit ||
                DateTime.fromSQL(a.dateFin).year === parameters.anneeAudit)
          );
          if (!audit) {
            throw new HttpException(
              `Aucun audit trouvé pour la collectivité ${collectiviteId} et l'année ${parameters.anneeAudit}`,
              400
            );
          }
        } else if (parameters.auditId) {
          audit = audits.find((a) => a.id === parameters.auditId);
          if (!audit) {
            throw new HttpException(
              `Aucun audit trouvé pour la collectivité ${collectiviteId} et l'id d'audit ${parameters.auditId}`,
              400
            );
          }
          parameters.anneeAudit =
            DateTime.fromISO((audit.dateFin || audit.dateDebut)!).year ||
            DateTime.fromSQL((audit.dateFin || audit.dateDebut)!).year;
        }
        auditId = audit.id;
        parameters.date =
          (parameters.jalon === SnapshotJalonEnum.PRE_AUDIT
            ? audit.dateDebut
            : audit.dateFin) || undefined;

        this.logger.log(
          `Audit ${auditId} trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId} avec le jaon ${parameters.jalon}: ${parameters.date}`
        );
      }
    } else {
      parameters.jalon = parameters.date
        ? SnapshotJalonEnum.DATE_PERSONNALISEE
        : SnapshotJalonEnum.COURANT;
    }

    if (parameters.snapshotNom) {
      // parameters.snapshot = true;
      if (
        parameters.jalon !== SnapshotJalonEnum.COURANT &&
        parameters.jalon !== SnapshotJalonEnum.DATE_PERSONNALISEE
      ) {
        throw new HttpException(
          `Un nom de snapshot ne peut être défini que pour le score courant ou une date personnalisée`,
          400
        );
      }
    }

    const niveauAccess: PermissionLevel = PermissionLevelEnum.LECTURE;
    // if (parameters.snapshot) {
    //   niveauAccess = PermissionLevel.EDITION;
    // }

    let collectiviteInfo: undefined | CollectiviteAvecType;
    if (!noCheck && niveauAccess !== PermissionLevelEnum.LECTURE) {
      // Lecture allowed for anonymous access
      collectiviteInfo = await this.checkCollectiviteAndReferentielWithAccess(
        collectiviteId,
        referentielId,
        user,
        niveauAccess
      );
    } else {
      collectiviteInfo =
        await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
    }

    if (!referentiel) {
      referentiel = await this.getReferentielsService.getReferentielTree(
        referentielId,
        true,
        parameters.avecReferentielsOrigine
      );
    }

    const actionLevel = referentiel.orderedItemTypes.indexOf(
      ActionTypeEnum.ACTION
    );
    if (actionLevel === -1) {
      throw new HttpException(
        `Action type ${ActionTypeEnum.ACTION} not found for referentiel ${referentielId}`,
        500
      );
    }

    const etoilesDefinitions =
      await this.labellisationService.getEtoileDefinitions();

    const personnalisationConsequencesResult =
      await this.personnalisationService.getPersonnalisationConsequencesForCollectivite(
        collectiviteId,
        {
          date: parameters.date,
          referentiel: referentielId as ReferentielId,
        },
        undefined, // already checked
        collectiviteInfo
      );

    if (!parameters.avecReferentielsOrigine) {
      const actionStatuts = await this.getReferentielActionStatuts(
        referentielId,
        collectiviteId,
        parameters.date
      );

      const actionStatutExplications =
        await this.getReferentielActionStatutExplications(
          referentielId,
          collectiviteId,
          parameters.date
        );
      const actionPreuves = await this.documentService.getActionPreuves(
        collectiviteId,
        referentielId,
        parameters.date
      );

      this.logger.log(`Recalcul des scores `);
      const referentielWithScore = this.computeScore(
        referentiel.itemsTree as TreeNode<
          ActionDefinitionEssential &
            Partial<ScoreFields> &
            CorrelatedActionsWithScoreFields
        >,
        personnalisationConsequencesResult.consequences,
        actionStatuts,
        actionLevel,
        referentielId === 'te' || referentielId === 'te-test', // Disable potentiel redistribution for te referentiel
        actionStatutExplications,
        actionPreuves,
        etoilesDefinitions
      );

      const scoresPayload: ScoresPayload = {
        jalon: parameters.jalon,
        auditId,
        anneeAudit: parameters.anneeAudit,
        referentielId: referentielId,
        referentielVersion: referentiel.version,
        collectiviteId,
        collectiviteInfo,
        date: parameters.date || DateTime.now().toISO(),
        scores: referentielWithScore as TreeNode<
          Pick<ActionDefinition, 'identifiant' | 'nom' | 'categorie'> &
            ActionDefinitionEssential &
            ScoreFinalFields
        >,
      };

      // if (parameters.snapshot) {
      //   this.logger.log(
      //     `Sauvegarde du snapshot pour la date ${getScoreResult.date} correspondant au jalon ${getScoreResult.jalon} et à l'année d'audit ${getScoreResult.anneeAudit}`
      //   );
      //   // The snapshot slug is automatically set in saveSnapshotForScoreResponse
      //   await this.snapshotsService.saveSnapshotForScoreResponse(
      //     getScoreResult,
      //     personnalisationConsequencesResult.reponses,
      //     parameters.snapshotNom,
      //     parameters.snapshotForceUpdate,
      //     tokenInfo?.id
      //   );
      // }

      // Calcule et ajoute les scores indicatifs dans l'arbre des scores
      const scoresIndicatifs =
        await this.scoreIndicatifService.getScoresIndicatifsForPayload(
          collectiviteId
        );
      this.ajouteScoresIndicatifs(scoresIndicatifs, scoresPayload.scores);

      return {
        scoresPayload,
        personnalisationReponsesPayload:
          personnalisationConsequencesResult.reponses,
      };
    } else {
      const scores = await this.computeScoreFromReferentielsOrigine(
        collectiviteId,
        parameters,
        referentiel.itemsTree as TreeNode<
          ActionDefinitionEssential &
            Partial<ScoreFields> &
            CorrelatedActionsWithScoreFields
        >,
        actionLevel,
        referentielId === 'te' || referentielId === 'te-test', // Disable potentiel redistribution for te referentiel
        personnalisationConsequencesResult.consequences,
        etoilesDefinitions
      );

      const scoresPayload = {
        jalon: parameters.jalon,
        collectiviteId,
        referentielId: referentielId,
        referentielVersion: referentiel.version,
        collectiviteInfo,
        date: parameters.date || new Date().toISOString(),
        scores: scores,
      };

      return {
        scoresPayload,
        personnalisationReponsesPayload:
          personnalisationConsequencesResult.reponses,
      };
    }
  }

  getRatioFromOrigineActions(
    origineActions: CorrelatedActionWithScore[] | undefined,
    referentielPointsPotentiels: number | null
  ): number {
    // Compute points potentiels by using origine actions with ponderation
    const originePointsReferentiel = origineActions?.reduce(
      (acc, origineAction) =>
        acc +
        (origineAction.score?.pointReferentiel || 0) *
          (origineAction.ponderation || 1),
      0
    );
    const ratio = originePointsReferentiel
      ? (referentielPointsPotentiels || 0) / originePointsReferentiel
      : 0;
    return ratio;
  }

  getScoreFromOrigineActionsAndRatio(
    ratio: number,
    origineActions: CorrelatedActionWithScore[] | undefined,
    roundingDigits: number,
    referentielPointsPotentiels?: number | null
  ): Partial<Pick<ScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'>> &
    Omit<ScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'> {
    const initialScore: Partial<
      Pick<ScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'>
    > &
      Omit<ScoreWithOnlyPoints, 'pointPotentiel' | 'pointReferentiel'> = {
      pointFait: 0,
      pointProgramme: 0,
      pointPasFait: 0,
      pointNonRenseigne: 0,
    };
    initialScore.pointFait = roundTo(
      ratio *
        (origineActions?.reduce(
          (acc, origineAction) =>
            acc +
            ((origineAction.score?.faitTachesAvancement || 0) /
              (origineAction.score?.totalTachesCount || 1)) *
              (origineAction.score?.pointReferentiel || 0) *
              (origineAction.ponderation || 1),
          0
        ) || 0),
      roundingDigits
    );

    initialScore.pointProgramme = roundTo(
      ratio *
        (origineActions?.reduce(
          (acc, origineAction) =>
            acc +
            ((origineAction.score?.programmeTachesAvancement || 0) /
              (origineAction.score?.totalTachesCount || 1)) *
              (origineAction.score?.pointReferentiel || 0) *
              (origineAction.ponderation || 1),
          0
        ) || 0),
      roundingDigits
    );
    initialScore.pointPasFait = roundTo(
      ratio *
        (origineActions?.reduce(
          (acc, origineAction) =>
            acc +
            ((origineAction.score?.pasFaitTachesAvancement || 0) /
              (origineAction.score?.totalTachesCount || 1)) *
              (origineAction.score?.pointReferentiel || 0) *
              (origineAction.ponderation || 1),
          0
        ) || 0),
      roundingDigits
    );

    if (isNil(referentielPointsPotentiels)) {
      referentielPointsPotentiels =
        roundTo(
          ratio *
            (origineActions?.reduce(
              (acc, origineAction) =>
                acc +
                (origineAction.score?.pointReferentiel || 0) *
                  (origineAction.ponderation || 1),
              0
            ) || 0),
          roundingDigits
        ) || 0;

      initialScore.pointReferentiel = referentielPointsPotentiels;
      initialScore.pointPotentiel = referentielPointsPotentiels;
    }

    // If new action (no origine actions), set non renseigne to all points
    initialScore.pointNonRenseigne = roundTo(
      (referentielPointsPotentiels || 0) -
        (initialScore.pointFait || 0) -
        (initialScore.pointProgramme || 0) -
        (initialScore.pointPasFait || 0),
      roundingDigits
    );

    return initialScore;
  }

  updateFromOrigineActions(
    action: TreeNode<
      ActionDefinitionEssential & ScoreFields & CorrelatedActionsWithScoreFields
    >,
    roundingDigits = ScoresService.DEFAULT_ROUNDING_DIGITS
  ) {
    const initialScore = action.score;
    const origineActions = action.actionsOrigine;

    const referentielPointsPotentiels = !isNil(initialScore.pointPotentiel)
      ? initialScore.pointPotentiel
      : initialScore.pointReferentiel;

    const ratio = this.getRatioFromOrigineActions(
      origineActions,
      referentielPointsPotentiels
    );
    const scoreFromOrigineActions = this.getScoreFromOrigineActionsAndRatio(
      ratio,
      origineActions,
      roundingDigits,
      referentielPointsPotentiels
    );
    action.score = {
      ...initialScore,
      ...scoreFromOrigineActions,
    };

    // Update origine score
    action.scoresOrigine = {};
    action.referentielsOrigine?.forEach((referentielid) => {
      const origineReferentielActions =
        action.actionsOrigine?.filter(
          (action) => action.referentielId === referentielid
        ) ?? [];
      // Scores tag is the part of the new score corresponding to each referentiel (renormalized)
      // whereas score origin is the sum of the children origin scores without renormalization
      action.scoresTag![referentielid] =
        this.getScoreFromOrigineActionsAndRatio(
          ratio,
          origineReferentielActions,
          roundingDigits,
          null // Set to null to compute the potentiel points from the origine actions
        ) as ScoreWithOnlyPoints;

      const {
        pointFait,
        pointProgramme,
        pointPasFait,
        pointNonRenseigne,
        pointPotentiel,
        pointReferentiel,
      } = origineReferentielActions.reduce(
        (acc, action) => {
          acc.pointFait += action.score?.pointFait || 0;
          acc.pointProgramme += action.score?.pointProgramme || 0;
          acc.pointPasFait += action.score?.pointPasFait || 0;
          acc.pointNonRenseigne += action.score?.pointNonRenseigne || 0;
          acc.pointPotentiel += action.score?.pointPotentiel || 0;
          acc.pointReferentiel += action.score?.pointReferentiel || 0;
          return acc;
        },
        {
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointNonRenseigne: 0,
          pointPotentiel: 0,
          pointReferentiel: 0,
        }
      );

      action.scoresOrigine![referentielid] = {
        pointFait: roundTo(pointFait, roundingDigits),
        pointProgramme: roundTo(pointProgramme, roundingDigits),
        pointPasFait: roundTo(pointPasFait, roundingDigits),
        pointNonRenseigne: roundTo(pointNonRenseigne, roundingDigits),
        pointPotentiel: roundTo(pointPotentiel, roundingDigits),
        pointReferentiel: roundTo(pointReferentiel, roundingDigits),
      };
    });
  }

  private affectScoreRecursivelyFromOrigineActions(
    action: TreeNode<
      ActionDefinitionEssential & ScoreFields & CorrelatedActionsWithScoreFields
    >
  ) {
    if (action.actionsEnfant?.length) {
      action.actionsEnfant.forEach((actionEnfant) => {
        this.affectScoreRecursivelyFromOrigineActions(actionEnfant);
      });
    }

    if (action.actionType === ActionTypeEnum.SOUS_ACTION) {
      this.updateFromOrigineActions(action);
    } else {
      // Consolidate score from children
      this.mergeScoresEnfants(
        action.score,
        action.actionsEnfant.map((enfant) => enfant.score)
      );
      action.scoresOrigine = {};
      action.referentielsOrigine?.forEach((referentielId) => {
        const originalConsolidatedScore: ScoreWithOnlyPoints = {
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointNonRenseigne: 0,
          pointPotentiel: 0,
          pointReferentiel: 0,
        };
        this.mergePointScoresEnfants(
          originalConsolidatedScore,
          action.actionsEnfant.map((enfant) =>
            enfant.scoresOrigine && enfant.scoresOrigine[referentielId]
              ? enfant.scoresOrigine[referentielId]
              : {
                  pointFait: 0,
                  pointProgramme: 0,
                  pointPasFait: 0,
                  pointNonRenseigne: 0,
                  pointPotentiel: 0,
                  pointReferentiel: 0,
                }
          ),
          true
        );
        action.scoresOrigine![referentielId] = originalConsolidatedScore;
      });
    }

    // now that the score has been consolidated, we can compute the score by tag
    if (action.tags) {
      action.tags.forEach((tag) => {
        // if has not already been set by updateFromOrigineActions
        if (!action.scoresTag[tag]) {
          action.scoresTag[tag] = action.score;
        }
      });
    }
    // Get all tags from children
    const allTags = [
      ...new Set(
        action.actionsEnfant
          .map((enfant) => Object.keys(enfant.scoresTag))
          .flat()
      ).values(),
    ];
    allTags.forEach((tag) => {
      // if the full score has not bee affected yet (= tag on parent)
      if (!action.scoresTag[tag]) {
        const scoreEnfant = action.actionsEnfant.map(
          (enfant) =>
            enfant.scoresTag[tag] || {
              point_fait: 0,
              point_programme: 0,
              point_pas_fait: 0,
              point_non_renseigne: 0,
              point_potentiel: enfant.score.pointPotentiel,
              point_referentiel: enfant.score.pointReferentiel,
            }
        );
        const consolidatedScore: ScoreWithOnlyPoints = {
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointNonRenseigne: 0,
          pointPotentiel: 0,
          pointReferentiel: 0,
        };
        this.mergePointScoresEnfants(
          consolidatedScore,
          scoreEnfant,
          true,
          ScoresService.DEFAULT_ROUNDING_DIGITS
        );
        action.scoresTag[tag] = consolidatedScore;
      }
    });
  }

  private fillScoreMap(
    action: TreeNode<ActionDefinitionEssential & ScoreFinalFields>,
    scoreMap: ScoresByActionId
  ) {
    scoreMap[action.actionId] = action.score;
    action.actionsEnfant.forEach((actionEnfant) => {
      this.fillScoreMap(actionEnfant, scoreMap);
    });
    return scoreMap;
  }

  private fillScorePercentageMap(
    action: TreeNode<ActionDefinitionEssential & ScoreFinalFields>,
    scorePercentageMap: { [actionId: string]: number }
  ) {
    scorePercentageMap[action.actionId] = action.score.pointPotentiel
      ? (action.score.pointFait || 0) / action.score.pointPotentiel
      : 0;
    action.actionsEnfant.forEach((actionEnfant) => {
      this.fillScorePercentageMap(actionEnfant, scorePercentageMap);
    });
    return scorePercentageMap;
  }

  computeScoreMap(
    action: TreeNode<ActionDefinitionEssential>,
    personnalisationConsequences: PersonnalisationConsequencesByActionId,
    actionStatuts: ActionStatutsByActionId,
    actionLevel: number,
    disablePotentielRedistribution?: boolean
  ): ScoresByActionId {
    const score = this.computeScore(
      action,
      personnalisationConsequences,
      actionStatuts,
      actionLevel,
      disablePotentielRedistribution || false
    );

    const getActionScores: ScoresByActionId = {};
    this.fillScoreMap(score, getActionScores);
    return getActionScores;
  }

  private async computeScoreFromReferentielsOrigine(
    collectiviteId: number,
    parameters: GetReferentielScoresRequestType,
    referentiel: TreeNode<
      ActionDefinitionEssential &
        Partial<ScoreFields> &
        CorrelatedActionsWithScoreFields
    >,
    actionLevel: number,
    disablePotentielRedistribution: boolean,
    personnalisationConsequences: PersonnalisationConsequencesByActionId,
    etoilesDefinitions?: EtoileDefinition[]
  ) {
    const actionsOrigineMap: {
      [origineActionId: string]: CorrelatedActionWithScore;
    } = {};

    const actionWithScore = this.buildActionWithScore(
      referentiel,
      undefined,
      undefined,
      actionsOrigineMap
    );

    // On applique recursivement le facteur de potentiel perso
    this.appliquePersonnalisationPotentielPerso(
      actionWithScore,
      personnalisationConsequences
    );

    // On applique recursivement la desactivation liée à la personnalisation
    // la desactivation mais également le flag concerné à false
    this.appliquePersonnalisationDesactivation(
      actionWithScore,
      personnalisationConsequences,
      true // On met le point potentiel à 0 si c'est désactivé
    );

    // Si besoin (pas pour le nouveau referentiel), on redistribue les points liés aux actions désactivées et non concernées aux action frères/soeurs
    // Dans tous les cas, on recalcule les points potentiels sur tout l'arbre pour prendre en compte les désactivations et les redistributions
    // Passé cette étape, les points potentiels ne sont plus censés bouger
    this.redistribuePotentielActionsDesactiveesNonConcerneesEtRecalculePotentielParent(
      actionWithScore,
      actionLevel,
      disablePotentielRedistribution
    );

    // Recompute scores for origine referentiels
    // TODO: get already computed scores from database
    const referentielsOrigine = referentiel.referentielsOrigine || [];

    const scoreMap: ScoresByActionId = {};

    const referentielsOriginePromiseScores: Promise<ScoresPayload>[] = [];
    referentielsOrigine.forEach(async (referentielOrigine) => {
      const result = this.computeScoreForCollectivite(
        referentielOrigine as ReferentielId,
        collectiviteId,
        {
          ...parameters,
          avecReferentielsOrigine: false,
        }
      ).then((result) => result.scoresPayload);
      referentielsOriginePromiseScores.push(result);
    });

    const referentielsOrigineScores = await Promise.all(
      referentielsOriginePromiseScores
    );

    referentielsOrigineScores.forEach((referentielOrigineScore) => {
      this.fillScoreMap(referentielOrigineScore.scores, scoreMap);
    });

    // Apply scores to origine actions
    const actionOrigines = Object.keys(actionsOrigineMap);
    actionOrigines.forEach((origineActionId) => {
      const origineAction = actionsOrigineMap[origineActionId];
      if (scoreMap[origineActionId]) {
        origineAction.score = this.getActionPointScoreWithAvancement(
          scoreMap[origineActionId]
        );
      } else {
        this.logger.warn(
          `Score not found for origine action ${origineActionId}`
        );
      }
    });

    this.affectScoreRecursivelyFromOrigineActions(actionWithScore);
    //Reset original scores at the root level (not exactly the same in case some action have been removed in new referentiel)
    referentielsOrigine.forEach((referentielOrigine) => {
      actionWithScore.scoresOrigine![referentielOrigine] =
        this.getActionPointScore(scoreMap[referentielOrigine]);
    });

    this.appliqueRounding(actionWithScore);

    if (etoilesDefinitions) {
      this.computeEtoiles(actionWithScore, etoilesDefinitions);
    }

    return actionWithScore as TreeNode<
      Pick<ActionDefinition, 'identifiant' | 'nom' | 'categorie'> &
        ActionDefinitionEssential &
        ScoreFinalFields
    >;
  }

  private computeScore(
    action: TreeNode<
      ActionDefinitionEssential &
        Partial<ScoreFields> &
        CorrelatedActionsWithScoreFields
    >,
    personnalisationConsequences: PersonnalisationConsequencesByActionId,
    actionStatuts: ActionStatutsByActionId,
    actionLevel: number,
    disablePotentielRedistribution: boolean,
    actionStatutExplications?: GetActionStatutExplicationsResponseType,
    actionPreuves?: { [actionId: string]: PreuveDto[] },
    etoilesDefinitions?: EtoileDefinition[]
  ) {
    const actionStatutsKeys = Object.keys(actionStatuts);
    for (const actionStatutKey of actionStatutsKeys) {
      const actionStatut = actionStatuts[actionStatutKey];
      // force le remplissage de l'avancement détaillé si il n'est pas renseigné
      this.fillAvancementDetailleFromAvancement(actionStatut);
    }

    const actionWithScore = this.buildActionWithScore(
      action,
      actionStatutExplications,
      actionPreuves
    );

    // On applique recursivement le facteur de potentiel perso
    this.appliquePersonnalisationPotentielPerso(
      actionWithScore,
      personnalisationConsequences
    );

    // On applique recursivement la desactivation liée à la personnalisation
    // la desactivation mais également le flag concerné à false
    this.appliquePersonnalisationDesactivation(
      actionWithScore,
      personnalisationConsequences
    );

    // On désactive les actions non concernées
    // on remonte aux parents pour les rendre non concernés si tous les enfants sont non concernés
    this.appliqueActionStatutNonConcerneEtRemonteAuxParents(
      actionWithScore,
      actionStatuts
    );

    // Si besoin (pas pour le nouveau referentiel), on redistribue les points liés aux actions désactivées et non concernées aux action frères/soeurs
    // Dans tous les cas, on recalcule les points potentiels sur tout l'arbre pour prendre en compte les désactivations et les redistributions
    // Passé cette étape, les points potentiels ne sont plus censés bouger
    this.redistribuePotentielActionsDesactiveesNonConcerneesEtRecalculePotentielParent(
      actionWithScore,
      actionLevel,
      disablePotentielRedistribution
    );

    // On prend en compte les avancements des actions
    this.appliqueActionAvancementEtRemonteAuxParents(
      actionWithScore,
      actionStatuts
    );

    // personalisation scores
    const scorePercentages = this.fillScorePercentageMap(actionWithScore, {});
    this.appliquePersonnalisationScore(
      actionWithScore,
      personnalisationConsequences,
      scorePercentages
    );

    this.appliqueRounding(actionWithScore);

    if (etoilesDefinitions) {
      this.computeEtoiles(actionWithScore, etoilesDefinitions);
    }

    return actionWithScore as TreeNode<
      Pick<ActionDefinition, 'identifiant' | 'nom' | 'categorie'> &
        ActionDefinitionEssential &
        ScoreFinalFields
    >;
  }

  // Enrichit l'arbre des scores avec les scores indicatifs
  private ajouteScoresIndicatifs(
    scoresIndicatifs: Array<{ actionId: string; score: ScoreIndicatifPayload }>,
    node: TreeNode<
      ActionDefinitionEssential &
        ScoreFinalFields & { scoreIndicatif?: ScoreIndicatifPayload }
    >
  ) {
    const scoreIndicatif = scoresIndicatifs.find(
      (s) => s.actionId === node.actionId
    );
    if (scoreIndicatif) {
      node.scoreIndicatif = scoreIndicatif.score;
    }
    node.actionsEnfant?.forEach((node) =>
      this.ajouteScoresIndicatifs(scoresIndicatifs, node)
    );
  }

  private async getCamelcaseKeysFunction(): Promise<any> {
    const module = await (eval(`import('camelcase-keys')`) as Promise<any>);
    return module.default;
  }

  private async getClientScoresForCollectivite(
    referentielId: ReferentielId,
    collectiviteId: number,
    etoilesDefinition?: EtoileDefinition[]
  ): Promise<{
    date: string;
    scoresMap: ScoresByActionId;
  }> {
    this.logger.log(
      `Récupération des scores courants de la collectivité ${collectiviteId} pour le referentiel ${referentielId}`
    );

    const scores = await this.databaseService.db
      .select()
      .from(clientScoresTable)
      .where(
        and(
          eq(clientScoresTable.referentiel, referentielId),
          eq(clientScoresTable.collectiviteId, collectiviteId)
        )
      )
      .orderBy(desc(clientScoresTable.payloadTimestamp));
    return this.getFirstDatabaseScoreFromJsonb(scores, etoilesDefinition);
  }

  private async getFirstDatabaseScoreFromJsonb(
    scoreRecords: ClientScoresType[],
    etoilesDefinition?: EtoileDefinition[]
  ): Promise<{
    date: string;
    scoresMap: ScoresByActionId;
  }> {
    if (!scoreRecords.length) {
      throw new NotFoundException(`No scores found`);
    }

    if (!scoreRecords[0].payloadTimestamp || !scoreRecords[0].scores) {
      throw new HttpException(`Invalid scores`, 500);
    }

    const getActionScoresResponse: ScoresByActionId = {};

    const lastScoreDate = scoreRecords[0].payloadTimestamp;
    this.logger.log(`Dernier score enregistré: ${lastScoreDate.toISOString()}`);

    // Due to esm import
    // See https://stackoverflow.com/questions/74830166/unable-to-import-esm-module-in-nestjs
    const camelcaseKeys = await this.getCamelcaseKeysFunction();
    const scoreList = (scoreRecords[0].scores as any[]).map(
      (score) => camelcaseKeys(score) as Score
    ) as Score[];
    scoreList.forEach((score) => {
      getActionScoresResponse[score.actionId] = score;
    });

    const rootScore = getActionScoresResponse[scoreRecords[0].referentiel];
    if (etoilesDefinition && rootScore) {
      this.fillEtoilesInScore(rootScore, etoilesDefinition);
    }

    return {
      date: lastScoreDate.toISOString(),
      scoresMap: getActionScoresResponse,
    };
  }

  async checkScoreForLastModifiedCollectivite(
    parameters: CheckMultipleReferentielScoresRequestType,
    hostUrl?: string
  ): Promise<GetMultipleCheckScoresResponseType> {
    const statusList = Object.values(CheckScoreStatus);
    const response: GetMultipleCheckScoresResponseType = {
      count: 0,
      countByStatus: {},
      referentielCountByStatus: {},
      resultats: [],
    };
    statusList.forEach((status) => {
      response.countByStatus[status] = 0;
    });

    const lastChangesDate = DateTime.now().minus({
      days: parameters.nbJours,
    });
    this.logger.log(
      `Recuperation des collectivites dont le score a été modifié depuis ${lastChangesDate.toISO()} (${
        parameters.nbJours
      } jours)`
    );

    const lastChanges = await this.databaseService.db
      .select()
      .from(clientScoresTable)
      .where(gte(clientScoresTable.modifiedAt, lastChangesDate.toJSDate()));

    this.logger.log(`Nombre de scores modifiés: ${lastChanges.length}`);
    response.count = lastChanges.length;

    const lastChangesChunks = chunk(
      lastChanges,
      ScoresService.MULTIPLE_COLLECTIVITE_CHUNK_SIZE
    );
    const checkScorePromises: Promise<GetCheckScoresResponseType>[] = [];
    let iChunk = 0;
    for (const lastChangesChunk of lastChangesChunks) {
      this.logger.log(
        `Chunk ${iChunk}/${lastChangesChunks.length} de ${lastChangesChunks.length} verifications`
      );
      lastChangesChunk.forEach((lastChange) => {
        checkScorePromises.push(
          this.checkScoreForCollectivite(
            lastChange.referentiel,
            lastChange.collectiviteId,
            parameters,
            hostUrl
          )
        );
      });
      const checkScores = await Promise.all(checkScorePromises);
      response.resultats.push(...checkScores);
      checkScorePromises.length = 0;
      iChunk++;
    }

    response.resultats.forEach((resultat) => {
      response.countByStatus[resultat.verification_status]++;
      if (!response.referentielCountByStatus[resultat.referentielId]) {
        response.referentielCountByStatus[resultat.referentielId] = {};
        statusList.forEach((status) => {
          response.referentielCountByStatus[resultat.referentielId][status] = 0;
        });
      }
      response.referentielCountByStatus[resultat.referentielId][
        resultat.verification_status
      ]++;
    });

    return response;
  }

  async checkScoreForCollectivite(
    referentielId: ReferentielId,
    collectiviteId: number,
    parameters: CheckReferentielScoresRequestType,
    hostUrl?: string,
    noClientScoreUpdateForMajorDifferences?: boolean
  ): Promise<GetCheckScoresResponseType> {
    this.logger.log(
      `Vérification du score de la collectivité ${collectiviteId} pour le referentiel ${referentielId} (parameters: ${JSON.stringify(
        parameters
      )})`
    );

    const savedScoreResult = await this.getClientScoresForCollectivite(
      referentielId,
      collectiviteId
    );

    const { scoresPayload } = await this.computeScoreForCollectivite(
      referentielId,
      collectiviteId,
      {
        date: parameters.utiliseDatePourScoreCourant
          ? savedScoreResult.date
          : undefined,
      }
    );

    const { scores, collectiviteInfo } = scoresPayload;
    const scoreMap = this.fillScoreMap(scores, {});

    const getReferentielScores: GetCheckScoresResponseType = {
      collectiviteId,
      referentielId: referentielId,
      date: savedScoreResult.date,
      verification_status: CheckScoreStatus.MAJOR_DIFFERENCES,
      differences: {},
    };
    const actionIds = Object.keys(scoreMap);
    actionIds.forEach((actionId) => {
      const savedScore = savedScoreResult.scoresMap[actionId];
      if (!isEqual(savedScore, scoreMap[actionId])) {
        const scoreDiff = this.getScoreDiff(
          scoreMap[actionId],
          savedScore,
          scoreMap
        );
        if (scoreDiff) {
          getReferentielScores.differences[actionId] = scoreDiff;
        }
      }
    });
    const differencesCount = Object.keys(
      getReferentielScores.differences
    ).length;
    if (!differencesCount) {
      getReferentielScores.verification_status =
        CheckScoreStatus.NO_DIFFERENCES;
    } else {
      const differenceList = Object.values(getReferentielScores.differences);
      const majorDifferences = differenceList.filter(
        (diff) =>
          diff.calcule?.pointFait !== diff.sauvegarde?.pointFait ||
          diff.calcule?.pointProgramme !== diff.sauvegarde?.pointProgramme ||
          diff.calcule?.pointPasFait !== diff.sauvegarde?.pointPasFait
      );
      if (majorDifferences.length) {
        getReferentielScores.verification_status =
          CheckScoreStatus.MAJOR_DIFFERENCES;
      } else {
        getReferentielScores.verification_status =
          CheckScoreStatus.MINOR_DIFFERENCES;
      }
    }

    // If there are major differences, try to trigger manually an update of the score using the legacy algorithm to check if the differences are still present
    if (
      getReferentielScores.verification_status ===
        CheckScoreStatus.MAJOR_DIFFERENCES &&
      !noClientScoreUpdateForMajorDifferences
    ) {
      this.logger.log(
        `Major differences have been detected, trying to update the score using the legacy algorithm`
      );

      await this.databaseService.db.execute(
        sql`select evaluation.evaluate_regles(${collectiviteId},'personnalisation_consequence','client_scores');`
      );

      this.logger.log(`Wait for client score to be updated`);
      for (let i = 0; i < 10; i++) {
        await sleep(1000);
        const newSavedScoreResult = await this.getClientScoresForCollectivite(
          referentielId,
          collectiviteId
        );
        if (newSavedScoreResult.date > savedScoreResult.date) {
          this.logger.log(
            `Client score updated (${newSavedScoreResult.date}, i=${i})`
          );
          break;
        }
      }

      const resultAfterUpdate = await this.checkScoreForCollectivite(
        referentielId,
        collectiviteId,
        { ...parameters, notification: false },
        hostUrl,
        true
      );
      this.logger.log(
        `Check status after update: ${resultAfterUpdate.verification_status}`
      );
      if (
        resultAfterUpdate.verification_status ===
        CheckScoreStatus.NO_DIFFERENCES
      ) {
        getReferentielScores.verification_status =
          CheckScoreStatus.MAJOR_DIFFERENCES_FIXED_AFTER_CLIENT_SCORE_UPDATE;
      }
    }

    if (differencesCount && parameters.notification) {
      let message = '';
      if (
        getReferentielScores.verification_status ===
        CheckScoreStatus.MAJOR_DIFFERENCES_FIXED_AFTER_CLIENT_SCORE_UPDATE
      ) {
        message = `:grimacing: Différences majeures de score corrigées après un déclenchement manuel de mise à jour pour la collectivité ${collectiviteId} et le referentiel ${referentielId} sur l'environnement ${process.env.ENV_NAME}.`;
      } else {
        const majorDifferences =
          getReferentielScores.verification_status ===
          CheckScoreStatus.MAJOR_DIFFERENCES;

        message = `${
          majorDifferences ? ':no_entry:' : ':warning:'
        } Différence ${majorDifferences ? 'majeure' : 'mineure'} de score${
          majorDifferences
            ? ` (points fait calculés: ${scoreMap[referentielId]?.pointFait}, points fait sauvegardés: ${savedScoreResult.scoresMap[referentielId]?.pointFait}, points pas fait calculés: ${scoreMap[referentielId]?.pointPasFait}, points pas fait sauvegardés: ${savedScoreResult.scoresMap[referentielId]?.pointPasFait}, points programmés calculés: ${scoreMap[referentielId]?.pointProgramme}, points pas fait sauvegardés: ${savedScoreResult.scoresMap[referentielId]?.pointProgramme})`
            : ''
        } pour la collectivité ${
          collectiviteInfo.nom
        } (${collectiviteId}) et le referentiel ${referentielId} sur l'environnement ${
          process.env.ENV_NAME
        }${
          hostUrl
            ? ` ([details](${hostUrl}/api/v1/collectivites/${collectiviteId}/referentiels/${referentielId}/check-scores?token=${this.configService.get(
                'SUPABASE_ANON_KEY'
              )})).`
            : '.'
        }`;
      }
      if (message) {
        await this.mattermostNotificationService.postMessage(message);
      }
    }

    return getReferentielScores;
  }

  getScoreDiff(
    computedScore: Score,
    savedScore: Score | undefined | null,
    fullScoreMap?: ScoresByActionId
  ): {
    sauvegarde: Partial<Score>;
    calcule: Partial<Score>;
  } | null {
    const savedScoreDiff: any = {};
    let scoreMapDiff: any = {};
    const scoreMapKeys = [
      ...new Set(
        Object.keys(computedScore).concat(Object.keys(savedScore || {}))
      ).values(),
    ] as (keyof Score)[];
    let hasDiff = false;
    if (savedScore) {
      for (const key of scoreMapKeys) {
        // We ignore renseigne (weird value in python) and point_potentiel_perso for now
        if (
          key !== 'aStatut' && // Not existing in python code
          key !== 'etoiles' && // Not existing in python code
          key !== 'explication' && // Not existing in python code
          key !== 'renseigne' &&
          key !== 'pointPotentielPerso'
        ) {
          if (!isEqual(savedScore[key], computedScore[key])) {
            hasDiff = true;

            if (
              key !== 'pointFait' &&
              key !== 'pointPotentiel' &&
              key !== 'pointReferentiel' &&
              key !== 'pointNonRenseigne' &&
              key !== 'pointProgramme' &&
              key !== 'pointPasFait' &&
              key !== 'faitTachesAvancement' &&
              key !== 'pasFaitTachesAvancement' &&
              key !== 'pasConcerneTachesAvancement' &&
              key !== 'programmeTachesAvancement'
            ) {
              hasDiff = true;
            } else {
              if (
                typeof savedScore[key] === 'number' &&
                typeof computedScore[key] === 'number'
              ) {
                const diff = Math.abs(savedScore[key] - computedScore[key]);
                const diffThreshold =
                  1 / Math.pow(10, ScoresService.DEFAULT_ROUNDING_DIGITS) +
                  1 / Math.pow(10, ScoresService.DEFAULT_ROUNDING_DIGITS + 1);

                if (diff <= diffThreshold) {
                  hasDiff = false;
                } else {
                  hasDiff = true;
                }
              } else {
                hasDiff = true;
              }
            }

            if (hasDiff) {
              savedScoreDiff[key] = savedScore[key];
              scoreMapDiff[key] = computedScore[key];
            }
          }
        }
      }
    } else {
      scoreMapDiff = computedScore;
    }

    if (hasDiff) {
      // Specific cases due to python code
      const diffKeys = Object.keys(savedScoreDiff).sort((a, b) =>
        a.localeCompare(b)
      );
      // Python is not affecting not concerne recursively
      if (
        ['concerne', 'pasConcerneTachesAvancement'].every((v) =>
          diffKeys.includes(v)
        )
      ) {
        if (!computedScore.concerne) {
          // Check if parent is not concerne
          let parentActionId = getParentIdFromActionId(computedScore.actionId);
          while (parentActionId) {
            const parentAction = fullScoreMap![parentActionId];
            if (!parentAction.concerne) {
              // Diff coming from python code which can be ignored
              hasDiff = false;
              break;
            }
            parentActionId = getParentIdFromActionId(parentActionId);
          }
        }
      }
    }

    if (hasDiff) {
      return {
        sauvegarde: savedScoreDiff,
        calcule: scoreMapDiff,
      };
    }
    return null;
  }
}
