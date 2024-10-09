import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, like, lte, SQL, SQLWrapper } from 'drizzle-orm';
import * as _ from 'lodash';
import { NiveauAcces, SupabaseJwtPayload } from '../../auth/models/auth.models';
import { AuthService } from '../../auth/services/auth.service';
import { CollectiviteAvecType } from '../../collectivites/models/collectivite.models';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import DatabaseService from '../../common/services/database.service';
import { roundTo } from '../../common/services/number.helper';
import { GetPersonnalitionConsequencesResponseType } from '../../personnalisations/models/get-personnalisation-consequences.response';
import ExpressionParserService from '../../personnalisations/services/expression-parser.service';
import PersonnalisationsService from '../../personnalisations/services/personnalisations-service';
import { ActionScoreType } from '../models/action-score.dto';
import {
  actionStatutTable,
  ActionStatutType,
} from '../models/action-statut.table';
import { ActionType } from '../models/action-type.enum';
import { clientScoresTable } from '../models/client-scores.table';
import { GetActionScoresResponseType } from '../models/get-action-scores.response';
import { GetActionStatutsResponseType } from '../models/get-action-statuts.response';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { historiqueActionStatutTable } from '../models/historique-action-statut.table';
import { ReferentielActionAvecScoreType } from '../models/referentiel-action-avec-score.dto';
import { ReferentielActionType } from '../models/referentiel-action.dto';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsService from './referentiels.service';

@Injectable()
export default class ReferentielsScoringService {
  private readonly logger = new Logger(ReferentielsScoringService.name);

  private static DEFAULT_ROUNDING_DIGITS = 3;

  constructor(
    private readonly authService: AuthService,
    private readonly collectivitesService: CollectivitesService,
    private readonly databaseService: DatabaseService,
    private readonly referentielsService: ReferentielsService,
    private readonly personnalisationService: PersonnalisationsService,
    private readonly expressionParserService: ExpressionParserService
  ) {}

  async checkCollectiviteAndReferentielWithAccess(
    collectiviteId: number,
    referentielId: ReferentielType,
    date?: string,
    tokenInfo?: SupabaseJwtPayload,
    niveauAccesMinimum = NiveauAcces.LECTURE
  ): Promise<CollectiviteAvecType> {
    // Check read access if a date is given (historical data)
    if (tokenInfo && date) {
      await this.authService.verifieAccesAuxCollectivites(
        tokenInfo,
        [collectiviteId],
        niveauAccesMinimum
      );
    }
    await this.referentielsService.checkReferentielExists(referentielId);

    return this.collectivitesService.getCollectiviteAvecType(collectiviteId);
  }

  buildReferentielAvecScore(
    referentiel: ReferentielActionType
  ): ReferentielActionAvecScoreType {
    const referentielAvecScore: ReferentielActionAvecScoreType = {
      ...referentiel,
      score: {
        action_id: referentiel.action_id!,
        point_referentiel: !_.isNil(referentiel.points)
          ? referentiel.points
          : null,
        point_potentiel: null,
        point_potentiel_perso: null,
        point_fait: null,
        point_pas_fait: null,
        point_non_renseigne: null,
        point_programme: null,
        concerne: true,
        completed_taches_count: null,
        total_taches_count: 1,
        fait_taches_avancement: null,
        programme_taches_avancement: null,
        pas_fait_taches_avancement: null,
        pas_concerne_taches_avancement: null,
        desactive: false,
        renseigne: true,
      },
      actions_enfant: [],
    };
    referentiel.actions_enfant.forEach((actionEnfant) => {
      const actionEnfantAvecScore =
        this.buildReferentielAvecScore(actionEnfant);
      referentielAvecScore.actions_enfant.push(actionEnfantAvecScore);
    });
    const totalTachesCount = referentielAvecScore.actions_enfant.length
      ? referentielAvecScore.actions_enfant.reduce(
          (acc, enfant) => acc + (enfant.score.total_taches_count || 1),
          0
        )
      : 1;
    referentielAvecScore.score.total_taches_count = totalTachesCount;

    return referentielAvecScore;
  }

  appliquePersonnalisationPotentielPerso(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    personnalisationConsequences: GetPersonnalitionConsequencesResponseType,
    potentielPerso?: number
  ) {
    let recursivePotentielPerso = potentielPerso;
    const actionPersonnalisationConsequences =
      personnalisationConsequences[referentielActionAvecScore.action_id!];
    // Si il y a un potentiel perso on l'applique et on le propagera aux enfants
    if (!_.isNil(actionPersonnalisationConsequences?.potentiel_perso)) {
      recursivePotentielPerso =
        actionPersonnalisationConsequences.potentiel_perso *
        (potentielPerso || 1);
      referentielActionAvecScore.score.point_potentiel_perso =
        recursivePotentielPerso *
        (referentielActionAvecScore.score.point_referentiel || 0);
    }

    if (
      !_.isNil(recursivePotentielPerso) &&
      referentielActionAvecScore.score.point_referentiel
    ) {
      referentielActionAvecScore.score.point_potentiel =
        recursivePotentielPerso *
        referentielActionAvecScore.score.point_referentiel;
    }

    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliquePersonnalisationPotentielPerso(
        actionEnfant,
        personnalisationConsequences,
        recursivePotentielPerso
      );
    });

    // Maintenant qu'on l'a appliqué aux enfants, on recalcule le potentiel perso du parent s'il n'a pas déjà été calculé
    if (_.isNil(referentielActionAvecScore.score.point_potentiel)) {
      if (referentielActionAvecScore.actions_enfant.length) {
        referentielActionAvecScore.score.point_potentiel =
          referentielActionAvecScore.actions_enfant.reduce((acc, enfant) => {
            if (_.isNil(enfant.score.point_potentiel)) {
              return acc + (enfant.score.point_referentiel || 0);
            }
            return acc + enfant.score.point_potentiel;
          }, 0);
      } else {
        referentielActionAvecScore.score.point_potentiel =
          referentielActionAvecScore.score.point_referentiel || 0;
      }
    }
  }

  appliquePersonnalisationDesactivation(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    personnalisationConsequences: GetPersonnalitionConsequencesResponseType,
    parentDesactivation?: boolean
  ) {
    const actionPersonnalisationConsequences =
      personnalisationConsequences[referentielActionAvecScore.action_id!];
    // Si le parent n'est pas déjà désactivé et il y a une desactivation on l'applique et on le propagera aux enfants
    if (!parentDesactivation && actionPersonnalisationConsequences?.desactive) {
      parentDesactivation = actionPersonnalisationConsequences?.desactive;
    }
    referentielActionAvecScore.score.desactive = parentDesactivation || false;
    if (referentielActionAvecScore.score.desactive) {
      // Si l'action est désactivée, on place le flag concerné à false
      referentielActionAvecScore.score.concerne = false;
    }

    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliquePersonnalisationDesactivation(
        actionEnfant,
        personnalisationConsequences,
        parentDesactivation
      );
    });
  }

  appliqueActionStatutNonConcerneEtRemonteAuxParents(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    actionStatuts: GetActionStatutsResponseType,
    parentConcerne: boolean = true
  ) {
    const actionStatut = actionStatuts[referentielActionAvecScore.action_id!];
    // Si le parent n'est pas déjà désactivé et il y a une desactivation on l'applique et on le propagera aux enfants
    if (parentConcerne && actionStatut && !actionStatut.concerne) {
      parentConcerne = actionStatut.concerne;
    }

    // On applique parent concerne que si il est à faut
    // Ceci afin d'éviter de réactiver une action qui a été désactivée par une règle de personnalisation
    if (!parentConcerne) {
      referentielActionAvecScore.score.concerne = parentConcerne;
    }

    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliqueActionStatutNonConcerneEtRemonteAuxParents(
        actionEnfant,
        actionStatuts,
        parentConcerne
      );
    });

    // Maintant qu'on l'a appliqué aux enfants, on remonte aux parents
    // Si tous ces enfants sont non concernés, alors il est non concerné
    if (
      referentielActionAvecScore.actions_enfant.length &&
      referentielActionAvecScore.actions_enfant.every(
        (enfant) => !enfant.score.concerne
      )
    ) {
      this.logger.log(
        `Tous les enfants de ${referentielActionAvecScore.action_id} sont non concernés, donc il est non concerné`
      );
      referentielActionAvecScore.score.concerne = false;
    }
  }

  redistribuePotentielActionsDesactiveesNonConcernees(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    actionLevel: number
  ) {
    // Appelle recursif sur les enfants pour commencer par le bas de l'arbre
    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.redistribuePotentielActionsDesactiveesNonConcernees(
        actionEnfant,
        actionLevel
      );
    });

    if (!referentielActionAvecScore.score.concerne) {
      // WARNING: on ne peut pas encore le mettre à 0 car on doit redistribuer les points
      //referentielActionAvecScore.score.point_potentiel = 0;
    } else {
      // On ne redistribue que pour les enfants de type sous-actions et taches
      // Autrement dit, que pour un parent au moins de type action
      if (referentielActionAvecScore.level >= actionLevel) {
        // On ne redistribue qu'aux actions concernées et qui n'ont pas un potentiel à 0'
        const enfantsConcernes: ReferentielActionAvecScoreType[] = [];
        referentielActionAvecScore.actions_enfant.forEach((enfant) => {
          if (enfant.score.concerne) {
            if (enfant.score.point_potentiel) {
              enfantsConcernes.push(enfant);
            } else {
            }
          }
        });

        if (enfantsConcernes.length) {
          const pointsARedistribuer =
            referentielActionAvecScore.actions_enfant.reduce((acc, enfant) => {
              if (!enfant.score.concerne) {
                const actionPointARedistribuer =
                  enfant.score.point_potentiel || 0;
                return acc + actionPointARedistribuer;
              }
              return acc;
            }, 0);

          const pointsParEnfant = pointsARedistribuer / enfantsConcernes.length;
          /*this.logger.log(
            `Points à redistribuer pour les ${enfantsConcernes.length} enfants actifs (sur ${referentielActionAvecScore.actions_enfant.length}) de l'action ${referentielActionAvecScore.action_id}: ${pointsParEnfant}`,
          );*/
          enfantsConcernes.forEach((enfant) => {
            if (_.isNil(enfant.score.point_potentiel)) {
              this.logger.warn(
                `Potentiel non renseigné pour ${enfant.action_id}, ne devrait pas être le cas à cette étape`
              );
              enfant.score.point_potentiel =
                enfant.score.point_referentiel || 0;
            }
            const nouveauPotentiel =
              enfant.score.point_potentiel + pointsParEnfant;
            const redistributionFactor =
              nouveauPotentiel / enfant.score.point_potentiel;
            this.appliqueRedistributionPotentiel(enfant, redistributionFactor);
          });
        } else {
          // TODO: que doit-on faire ?
        }
      }

      // On met à jour le potentiel du parent
      if (referentielActionAvecScore.actions_enfant.length) {
        const potentielParent =
          referentielActionAvecScore.actions_enfant.reduce(
            (acc, enfant) =>
              acc +
              (enfant.score.concerne ? enfant.score.point_potentiel || 0 : 0),
            0
          );
        referentielActionAvecScore.score.point_potentiel = potentielParent;
      }
    }
  }

  appliqueRedistributionPotentiel(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    redistributionFactor: number
  ) {
    referentielActionAvecScore.score.point_potentiel =
      referentielActionAvecScore.score.point_potentiel! * redistributionFactor;
    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliqueRedistributionPotentiel(actionEnfant, redistributionFactor);
    });
  }

  appliqueActionAvancementEtRemonteAuxParents(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    actionStatuts: GetActionStatutsResponseType
  ) {
    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliqueActionAvancementEtRemonteAuxParents(
        actionEnfant,
        actionStatuts
      );
    });

    // voir fonction update_action_scores_from_status
    if (!referentielActionAvecScore.score.concerne) {
      referentielActionAvecScore.score.point_fait = 0;
      referentielActionAvecScore.score.point_pas_fait = 0;
      referentielActionAvecScore.score.point_programme = 0;
      referentielActionAvecScore.score.point_potentiel = 0;
      referentielActionAvecScore.score.point_non_renseigne = 0;
      referentielActionAvecScore.score.completed_taches_count =
        referentielActionAvecScore.score.total_taches_count;
      referentielActionAvecScore.score.fait_taches_avancement = 0;
      referentielActionAvecScore.score.programme_taches_avancement = 0;
      referentielActionAvecScore.score.pas_fait_taches_avancement = 0;
      referentielActionAvecScore.score.pas_concerne_taches_avancement =
        referentielActionAvecScore.score.total_taches_count;
      referentielActionAvecScore.score.renseigne = true;
      /* todo: 
            point_potentiel_perso=tache_points_personnalise
            if is_personnalise and not is_desactive
            else None,
            */
    } else {
      const actionStatut = actionStatuts[referentielActionAvecScore.action_id!];
      if (actionStatut && actionStatut.avancement_detaille?.length === 3) {
        const pointsPotentiel =
          referentielActionAvecScore.score.point_potentiel ||
          referentielActionAvecScore.score.point_referentiel ||
          0;
        const pourcentageFait = actionStatut.avancement_detaille[0];
        const pourcentageProgramme = actionStatut.avancement_detaille[1];
        const pourcentagePasFait = actionStatut.avancement_detaille[2];
        referentielActionAvecScore.score.point_fait =
          pourcentageFait * pointsPotentiel;
        referentielActionAvecScore.score.point_pas_fait =
          pourcentagePasFait * pointsPotentiel;
        referentielActionAvecScore.score.point_programme =
          pourcentageProgramme * pointsPotentiel;
        referentielActionAvecScore.score.point_non_renseigne = 0;
        referentielActionAvecScore.score.completed_taches_count =
          referentielActionAvecScore.score.total_taches_count;
        referentielActionAvecScore.score.fait_taches_avancement =
          pourcentageFait * referentielActionAvecScore.score.total_taches_count;
        referentielActionAvecScore.score.programme_taches_avancement =
          pourcentageProgramme *
          referentielActionAvecScore.score.total_taches_count;
        referentielActionAvecScore.score.pas_fait_taches_avancement =
          pourcentagePasFait *
          referentielActionAvecScore.score.total_taches_count;
        referentielActionAvecScore.score.pas_concerne_taches_avancement = 0;
        referentielActionAvecScore.score.renseigne = true;

        // Il s'agit d'une tache sans statut, tous les points sont non renseignés
      } else if (!referentielActionAvecScore.actions_enfant?.length) {
        referentielActionAvecScore.score.point_fait = 0;
        referentielActionAvecScore.score.point_pas_fait = 0;
        referentielActionAvecScore.score.point_programme = 0;
        referentielActionAvecScore.score.point_non_renseigne =
          referentielActionAvecScore.score.point_potentiel;
        referentielActionAvecScore.score.completed_taches_count = 0;
        referentielActionAvecScore.score.fait_taches_avancement = 0;
        referentielActionAvecScore.score.programme_taches_avancement = 0;
        referentielActionAvecScore.score.pas_fait_taches_avancement = 0;
        referentielActionAvecScore.score.pas_concerne_taches_avancement = 0;
        referentielActionAvecScore.score.renseigne = false;
      } else {
        this.mergeScoresEnfants(
          referentielActionAvecScore.score,
          referentielActionAvecScore.actions_enfant.map(
            (enfant) => enfant.score
          )
        );
      }
    }
  }

  mergeScoresEnfants(
    scoreParent: ActionScoreType,
    scoreEnfants: ActionScoreType[]
  ) {
    // Les autres propriétés ont déjà été calculées
    scoreParent.point_pas_fait = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.point_pas_fait || 0),
      0
    );
    scoreParent.point_fait = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.point_fait || 0),
      0
    );
    scoreParent.point_programme = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.point_programme || 0),
      0
    );
    scoreParent.point_non_renseigne = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.point_non_renseigne || 0),
      0
    );
    scoreParent.completed_taches_count = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.completed_taches_count || 0),
      0
    );
    scoreParent.fait_taches_avancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.fait_taches_avancement || 0),
      0
    );
    scoreParent.programme_taches_avancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.programme_taches_avancement || 0),
      0
    );
    scoreParent.pas_fait_taches_avancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pas_fait_taches_avancement || 0),
      0
    );
    scoreParent.pas_concerne_taches_avancement = scoreEnfants.reduce(
      (acc, enfant) => acc + (enfant.pas_concerne_taches_avancement || 0),
      0
    );
    if (scoreParent.concerne && scoreParent.point_non_renseigne > 0) {
      scoreParent.renseigne = false;
    }
  }

  appliquePersonnalisationScore(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    personnalisationConsequences: GetPersonnalitionConsequencesResponseType,
    scoreMap: { [key: string]: number },
    overridenScoreFactor?: number
  ) {
    const actionPersonnalisationConsequences =
      personnalisationConsequences[referentielActionAvecScore.action_id!];
    // Si il y a un potentiel perso on l'applique et on le propagera aux enfants
    if (
      !_.isNil(actionPersonnalisationConsequences?.score_formule) &&
      referentielActionAvecScore.score.point_potentiel // if point_potentiel equals 0., no worthy reduction
    ) {
      const originalScore = scoreMap[referentielActionAvecScore.action_id!];
      const overridenScore =
        this.expressionParserService.parseAndEvaluateExpression(
          actionPersonnalisationConsequences.score_formule,
          null,
          null,
          scoreMap
        ) as number;

      if (!_.isNil(overridenScore) && originalScore > 0) {
        overridenScoreFactor = overridenScore / originalScore;
      }
    }

    if (!_.isNil(overridenScoreFactor)) {
      referentielActionAvecScore.score.point_fait =
        (referentielActionAvecScore.score.point_fait || 0) *
        overridenScoreFactor;
    }

    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliquePersonnalisationScore(
        actionEnfant,
        personnalisationConsequences,
        scoreMap,
        overridenScoreFactor
      );
    });

    // Maintenant qu'on a appliqué aux enfants, on reactualise les points des parents
    if (referentielActionAvecScore.actions_enfant.length) {
      referentielActionAvecScore.score.point_fait =
        referentielActionAvecScore.actions_enfant.reduce(
          (acc, enfant) => acc + (enfant.score.point_fait || 0),
          0
        );
    }
  }

  appliqueRounding(
    referentielActionAvecScore: ReferentielActionAvecScoreType,
    ndigits: number = ReferentielsScoringService.DEFAULT_ROUNDING_DIGITS
  ) {
    referentielActionAvecScore.actions_enfant.forEach((actionEnfant) => {
      this.appliqueRounding(actionEnfant, ndigits);
    });

    referentielActionAvecScore.score.point_potentiel = roundTo(
      referentielActionAvecScore.score.point_potentiel,
      ndigits
    );
    referentielActionAvecScore.score.point_fait = roundTo(
      referentielActionAvecScore.score.point_fait,
      ndigits
    );
    referentielActionAvecScore.score.point_programme = roundTo(
      referentielActionAvecScore.score.point_programme,
      ndigits
    );
    referentielActionAvecScore.score.point_non_renseigne = roundTo(
      referentielActionAvecScore.score.point_non_renseigne,
      ndigits
    );
    referentielActionAvecScore.score.point_pas_fait = roundTo(
      referentielActionAvecScore.score.point_pas_fait,
      ndigits
    );
    referentielActionAvecScore.score.point_referentiel = roundTo(
      referentielActionAvecScore.score.point_referentiel,
      ndigits
    );
    if (referentielActionAvecScore.score.point_potentiel_perso) {
      referentielActionAvecScore.score.point_potentiel_perso = roundTo(
        referentielActionAvecScore.score.point_potentiel_perso,
        ndigits
      );
    }
  }

  fillAvancementDetailleFromAvancement(
    actionStatut: Pick<ActionStatutType, 'avancement' | 'avancement_detaille'>
  ) {
    if (actionStatut.avancement === 'fait') {
      actionStatut.avancement_detaille = [1, 0, 0];
    } else if (actionStatut.avancement === 'programme') {
      actionStatut.avancement_detaille = [0, 1, 0];
    } else if (actionStatut.avancement === 'pas_fait') {
      actionStatut.avancement_detaille = [0, 0, 1];
    } else if (!actionStatut.avancement_detaille) {
      actionStatut.avancement_detaille = [0, 0, 0];
    }
  }

  async getReferentielActionStatuts(
    referentielId: ReferentielType,
    collectiviteId: number,
    date?: string,
    tokenInfo?: SupabaseJwtPayload,
    noCheck?: boolean
  ): Promise<GetActionStatutsResponseType> {
    const getActionStatuts: GetActionStatutsResponseType = {};

    this.logger.log(
      `Getting collectivite ${collectiviteId} action statuts for referentiel ${referentielId} and date ${date}`
    );

    if (!noCheck) {
      await this.checkCollectiviteAndReferentielWithAccess(
        collectiviteId,
        referentielId,
        date,
        tokenInfo
      );
    }

    const table = date ? historiqueActionStatutTable : actionStatutTable;

    const actionStatutsConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectivite_id, collectiviteId),
      like(table.action_id, `${referentielId}%`),
    ];
    if (date) {
      actionStatutsConditions.push(lte(table.modified_at, date));
    }
    // TODO: colonne referentiel dans les actionStatutTable ?
    const referentielActionStatuts = await this.databaseService.db
      .select()
      .from(table)
      .where(and(...actionStatutsConditions))
      .orderBy(asc(table.action_id), desc(table.modified_at));
    this.logger.log(
      `${referentielActionStatuts.length} statuts trouvees pour le referentiel ${referentielId} et la collectivite ${collectiviteId}`
    );
    referentielActionStatuts.forEach((actionStatut) => {
      if (!getActionStatuts[actionStatut.action_id]) {
        getActionStatuts[actionStatut.action_id] = actionStatut;
        this.fillAvancementDetailleFromAvancement(actionStatut);
      } else {
        // On ne garde que le dernier statut, déjà pris en compte par l'orderBy
      }
    });

    return getActionStatuts;
  }

  async computeScoreForCollectivite(
    referentielId: ReferentielType,
    collectiviteId: number,
    date?: string,
    tokenInfo?: SupabaseJwtPayload,
    noCheck?: boolean
  ): Promise<ReferentielActionAvecScoreType> {
    this.logger.log(
      `Calcul du score de la collectivité ${collectiviteId} pour le referentiel ${referentielId} à la date ${date}`
    );

    let collectiviteInfo: undefined | CollectiviteAvecType;
    if (!noCheck) {
      collectiviteInfo = await this.checkCollectiviteAndReferentielWithAccess(
        collectiviteId,
        referentielId,
        date,
        tokenInfo
      );
    }

    const referentiel = await this.referentielsService.getReferentiel(
      referentielId,
      true
    );

    const personnalisationConsequences =
      await this.personnalisationService.getPersonnalisationConsequencesForCollectivite(
        collectiviteId,
        {
          date,
          referentiel: referentielId as ReferentielType,
        },
        undefined, // already checked
        collectiviteInfo
      );

    const actionStatuts = await this.getReferentielActionStatuts(
      referentielId,
      collectiviteId,
      date
    );

    const actionLevel = referentiel.ordered_item_types.indexOf(
      ActionType.ACTION
    );
    if (actionLevel === -1) {
      throw new HttpException(
        `Action type ${ActionType.ACTION} not found for referentiel ${referentielId}`,
        500
      );
    }
    return this.computeScore(
      referentiel.items_tree!,
      personnalisationConsequences,
      actionStatuts,
      actionLevel
    );
  }

  fillScoreMap(
    score: ReferentielActionAvecScoreType,
    scoreMap: GetActionScoresResponseType
  ) {
    scoreMap[score.action_id!] = score.score;
    score.actions_enfant.forEach((actionEnfant) => {
      this.fillScoreMap(actionEnfant, scoreMap);
    });
    return scoreMap;
  }

  fillScorePercentageMap(
    score: ReferentielActionAvecScoreType,
    scorePercentageMap: { [actionId: string]: number }
  ) {
    scorePercentageMap[score.action_id!] = score.score.point_potentiel
      ? (score.score.point_fait || 0) / score.score.point_potentiel
      : 0;
    score.actions_enfant.forEach((actionEnfant) => {
      this.fillScorePercentageMap(actionEnfant, scorePercentageMap);
    });
    return scorePercentageMap;
  }

  computeScoreMap(
    referentiel: ReferentielActionType,
    personnalisationConsequences: GetPersonnalitionConsequencesResponseType,
    actionStatuts: GetActionStatutsResponseType,
    actionLevel: number
  ): GetActionScoresResponseType {
    const score = this.computeScore(
      referentiel,
      personnalisationConsequences,
      actionStatuts,
      actionLevel
    );

    const getActionScores: GetActionScoresResponseType = {};
    this.fillScoreMap(score, getActionScores);
    return getActionScores;
  }

  computeScore(
    referentiel: ReferentielActionType,
    personnalisationConsequences: GetPersonnalitionConsequencesResponseType,
    actionStatuts: GetActionStatutsResponseType,
    actionLevel: number
  ): ReferentielActionAvecScoreType {
    const actionStatutsKeys = Object.keys(actionStatuts);
    for (const actionStatutKey of actionStatutsKeys) {
      const actionStatut = actionStatuts[actionStatutKey];
      // force le remplissage de l'avancement détaillé si il n'est pas renseigné
      this.fillAvancementDetailleFromAvancement(actionStatut);
    }

    const referentielAvecScore = this.buildReferentielAvecScore(referentiel);

    // On applique recursivement le facteur de potentiel perso
    this.appliquePersonnalisationPotentielPerso(
      referentielAvecScore,
      personnalisationConsequences
    );

    // On applique recursivement la desactivation liée à la personnalisation
    // la desactivation mais également le flag concerné à false
    this.appliquePersonnalisationDesactivation(
      referentielAvecScore,
      personnalisationConsequences
    );

    // On désactive les actions non concernées
    // on remonte aux parents pour les rendre non concernés si tous les enfants sont non concernés
    this.appliqueActionStatutNonConcerneEtRemonteAuxParents(
      referentielAvecScore,
      actionStatuts
    );

    // On redistribue les points liés aux actions désactivées et non concernées aux action frères/soeurs
    this.redistribuePotentielActionsDesactiveesNonConcernees(
      referentielAvecScore,
      actionLevel
    );

    // On prend en compte les avancements des actions
    this.appliqueActionAvancementEtRemonteAuxParents(
      referentielAvecScore,
      actionStatuts
    );

    // personalisation scores
    const scorePercentages = this.fillScorePercentageMap(
      referentielAvecScore,
      {}
    );
    this.appliquePersonnalisationScore(
      referentielAvecScore,
      personnalisationConsequences,
      scorePercentages
    );

    this.appliqueRounding(referentielAvecScore);

    return referentielAvecScore;
  }

  async getClientScoresForCollectivite(
    referentielId: ReferentielType,
    collectiviteId: number
  ): Promise<{
    date: string;
    scoresMap: GetActionScoresResponseType;
  }> {
    this.logger.log(
      `Récupération des scores de la collectivité ${collectiviteId} pour le referentiel ${referentielId}`
    );

    const getActionScoresResponse: GetActionScoresResponseType = {};

    const scores = await this.databaseService.db
      .select()
      .from(clientScoresTable)
      .where(
        and(
          eq(clientScoresTable.referentiel, referentielId),
          eq(clientScoresTable.collectiviteId, collectiviteId)
        )
      );
    if (!scores.length) {
      throw new NotFoundException(
        `No scores found for referentiel ${referentielId} and collectivite ${collectiviteId}`
      );
    }

    if (!scores[0].payloadTimestamp || !scores[0].scores) {
      throw new HttpException(
        `Invalid scores for referentiel ${referentielId} and collectivite ${collectiviteId}`,
        500
      );
    }

    const scoreList = scores[0].scores as ActionScoreType[];
    scoreList.forEach((score) => {
      getActionScoresResponse[score.action_id] = score;
    });

    return {
      date: scores[0].payloadTimestamp.toISOString(),
      scoresMap: getActionScoresResponse,
    };
  }

  async checkScoreForCollectivite(
    referentielId: ReferentielType,
    collectiviteId: number
  ): Promise<GetCheckScoresResponseType> {
    this.logger.log(
      `Vérification du score de la collectivité ${collectiviteId} pour le referentiel ${referentielId}`
    );

    const savedScoreResult = await this.getClientScoresForCollectivite(
      referentielId,
      collectiviteId
    );

    const scores = await this.computeScoreForCollectivite(
      referentielId,
      collectiviteId,
      savedScoreResult.date
    );
    const scoreMap = this.fillScoreMap(scores, {});
    const getReferentielScores: GetCheckScoresResponseType = {
      date: savedScoreResult.date,
      differences: {},
    };
    const actionIds = Object.keys(scoreMap);
    actionIds.forEach((actionId) => {
      const savedScore = savedScoreResult.scoresMap[actionId];
      if (!_.isEqual(savedScore, scoreMap[actionId])) {
        const scoreDiff = this.getScoreDiff(scoreMap[actionId], savedScore);
        if (scoreDiff) {
          console.log(JSON.stringify(scoreMap[actionId]));
          console.log(JSON.stringify(savedScore));
          getReferentielScores.differences[actionId] = scoreDiff;
        }
      }
    });
    return getReferentielScores;
  }

  getScoreDiff(
    computedScore: ActionScoreType,
    savedScore: ActionScoreType | undefined | null
  ): {
    sauvegarde: Partial<ActionScoreType>;
    calcule: Partial<ActionScoreType>;
  } | null {
    const savedScoreDiff: any = {};
    let scoreMapDiff: any = {};
    const scoreMapKeys = [
      ...new Set(
        Object.keys(computedScore).concat(Object.keys(savedScore || {}))
      ).values(),
    ] as (keyof ActionScoreType)[];
    let hasDiff = false;
    if (savedScore) {
      for (const key of scoreMapKeys) {
        // We ignore renseigne (weird value in python) and point_potentiel_perso for now
        if (key !== 'renseigne' && key !== 'point_potentiel_perso') {
          // @ts-ignore
          if (!_.isEqual(savedScore[key], computedScore[key])) {
            hasDiff = true;

            if (
              key !== 'point_potentiel' &&
              key !== 'point_referentiel' &&
              key !== 'point_non_renseigne' &&
              key !== 'point_programme' &&
              key !== 'point_pas_fait'
            ) {
              hasDiff = true;
            } else {
              if (
                typeof savedScore[key] === 'number' &&
                typeof computedScore[key] === 'number'
              ) {
                const diff = Math.abs(savedScore[key] - computedScore[key]);
                console.log(`diff for ${key}: ${diff}`);
                const diffThreshold =
                  1 /
                    Math.pow(
                      10,
                      ReferentielsScoringService.DEFAULT_ROUNDING_DIGITS
                    ) +
                  Number.EPSILON;
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
              // @ts-ignore
              savedScoreDiff[key] = savedScore[key];
              // @ts-ignore
              scoreMapDiff[key] = computedScore[key];
            }
          }
        }
      }
    } else {
      scoreMapDiff = computedScore;
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
