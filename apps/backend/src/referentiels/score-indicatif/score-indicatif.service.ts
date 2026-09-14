import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import IndicateurExpressionService, {
  EvaluationContext,
} from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import ValeursReferenceService from '@tet/backend/indicateurs/valeurs/valeurs-reference.service';
import { GetValeursUtilisablesRequest } from '@tet/backend/referentiels/score-indicatif/get-valeurs-utilisables.request';
import {
  ScoreIndicatifError,
  ScoreIndicatifErrorEnum,
} from '@tet/backend/referentiels/score-indicatif/score-indicatif.errors';
import { SetValeursUtiliseesRequest } from '@tet/backend/referentiels/score-indicatif/set-valeurs-utilisees.request';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import {
  ActionScoreIndicatif,
  IndicateurAssocie,
  ScoreIndicatifActionValeurUtilisable,
  ScoreIndicatifPayload,
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { groupBy, keyBy } from 'es-toolkit';
import {
  buildValeursPourExpression,
  pickValeursUtiliseesPourResultat,
} from './compute-score-indicatif.rules';
import { GetScoreIndicatifRequest } from './get-score-indicatif.request';
import {
  buildIndicateursAssocies,
  filterIndicateursByLocalisation,
} from './indicateurs-associes.rules';
import {
  Formule,
  ScoreIndicatifRepository,
} from './score-indicatif.repository';
import {
  actionBelongsToReferentiel,
  formatScoreIndicatifForPayload,
} from './score-indicatif-payload.rules';
import { mapActionIdToValeurUtilisable } from './valeurs-utilisables.rules';

@Injectable()
export class ScoreIndicatifService {
  private readonly logger = new Logger(ScoreIndicatifService.name);

  constructor(
    private readonly repository: ScoreIndicatifRepository,
    private readonly transactionManager: TransactionManager,
    private readonly valeursReferenceService: ValeursReferenceService,
    private readonly collectivitesService: CollectivitesService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly indicateurValeursService: CrudValeursService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Renvoie la liste des valeurs utilisables pour le calcul du score indicatif
   */
  async getValeursUtilisables(
    input: GetValeursUtilisablesRequest,
    { user }: ServiceSecondArg
  ): Promise<
    Result<ScoreIndicatifActionValeurUtilisable[], ScoreIndicatifError>
  > {
    const formulesResult = await this.repository.getFormules(input.actionIds);
    if (!formulesResult.success) {
      return failure(formulesResult.error);
    }

    const indicateursAssociesResult = await this.getIndicateursAssocies({
      collectiviteId: input.collectiviteId,
      formules: formulesResult.data,
    });
    if (!indicateursAssociesResult.success) {
      return failure(indicateursAssociesResult.error);
    }
    const { indicateursAssocies } = indicateursAssociesResult.data;

    const indicateurIds = indicateursAssocies.map((ind) => ind.indicateurId);
    if (!indicateurIds.length) {
      this.logger.log(
        `Aucun indicateur trouvé pour les actions ${input.actionIds.join(',')}`
      );
      return success([]);
    }
    const valeursGroupees =
      await this.indicateurValeursService.listIndicateurValeurs(
        {
          collectiviteId: input.collectiviteId,
          indicateurIds,
        },
        user
      );

    const valeursUtiliseesResult =
      await this.repository.listValeursUtiliseesParActionId(input);
    if (!valeursUtiliseesResult.success) {
      return failure(valeursUtiliseesResult.error);
    }

    const valeursUtilisables = input.actionIds
      .map((actionId) =>
        mapActionIdToValeurUtilisable(
          actionId,
          indicateursAssocies,
          valeursGroupees,
          valeursUtiliseesResult.data
        )
      )
      .filter(
        (indicateursParActionId) => indicateursParActionId.indicateurs.length
      );

    return success(valeursUtilisables);
  }

  /**
   * Associe ou supprime le lien vers les valeurs utilisées pour le calcul du score indicatif
   */
  async setValeursUtilisees(
    input: SetValeursUtiliseesRequest,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, ScoreIndicatifError>> {
    let referentielId: ReferentielId;
    try {
      referentielId = getReferentielIdFromActionId(input.actionId);
    } catch {
      return failure(ScoreIndicatifErrorEnum.INVALID_ACTION_ID);
    }
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.REFERENTIEL,
      { collectiviteId: input.collectiviteId, referentielId }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    return this.transactionManager.executeSingle(
      (transaction) =>
        this.repository.replaceValeursUtiliseesForAction(input, transaction),
      tx
    );
  }

  /**
   * Calcule le score indicatif des actions à partir des indicateurs associés et
   * des valeurs/source/année sélectionnées
   */
  async getScoreIndicatif(
    input: GetScoreIndicatifRequest
  ): Promise<
    Result<Record<string, ActionScoreIndicatif>, ScoreIndicatifError>
  > {
    const formulesResult = await this.repository.getFormules(input.actionIds);
    if (!formulesResult.success) {
      return failure(formulesResult.error);
    }
    const formules = formulesResult.data;

    const valeursUtiliseesResult =
      await this.repository.listValeursUtiliseesParActionId(input);
    if (!valeursUtiliseesResult.success) {
      return failure(valeursUtiliseesResult.error);
    }
    const valeursUtiliseesParActionId = valeursUtiliseesResult.data;

    const indicateursAssociesResult = await this.getIndicateursAssocies({
      collectiviteId: input.collectiviteId,
      formules,
    });
    if (!indicateursAssociesResult.success) {
      return failure(indicateursAssociesResult.error);
    }
    const { indicateursAssocies, identiteCollectivite } =
      indicateursAssociesResult.data;
    const indicateursAssociesParActionId = groupBy(
      indicateursAssocies,
      ({ actionId }) => actionId
    );

    const referentielContextResult = await this.deriveReferentielContext(
      formules.map((f) => f.actionId)
    );
    if (!referentielContextResult.success) {
      return failure(referentielContextResult.error);
    }
    const referentielContext = referentielContextResult.data;

    const evaluationContext = await this.getEvaluationContext(
      input,
      indicateursAssocies,
      identiteCollectivite,
      referentielContext
    );

    const scoresIndicatifs = formules
      .map(({ actionId, exprScore }) => {
        if (!exprScore) {
          this.logger.log(
            `Formule manquante pour le calcul du score indicatif de l'action ${actionId}`
          );
          return null;
        }

        const indicateurs = indicateursAssociesParActionId[actionId];
        if (!indicateurs?.length) {
          this.logger.log(
            `Indicateurs manquants pour le calcul du score indicatif de l'action ${actionId}`
          );

          return null;
        }

        const valeursUtilisees = valeursUtiliseesParActionId[actionId] || [];
        if (!valeursUtilisees.length) {
          this.logger.log(
            `Valeurs manquantes pour le calcul du score indicatif de l'action ${actionId}`
          );
        }

        // groupe les valeurs par type de score (programmé ou fait)
        const valeursParTypeScore = groupBy(
          valeursUtilisees,
          (v) => v.typeScore
        );

        // calcul les scores
        const fait = this.computeScore(
          actionId,
          exprScore,
          valeursParTypeScore,
          indicateurs,
          scoreIndicatifTypeEnum.FAIT,
          evaluationContext
        );
        const programme = this.computeScore(
          actionId,
          exprScore,
          valeursParTypeScore,
          indicateurs,
          scoreIndicatifTypeEnum.PROGRAMME,
          evaluationContext
        );

        return {
          actionId,
          indicateurs,
          fait,
          programme,
        };
      })
      .filter((score) => !!score);

    return success(keyBy(scoresIndicatifs, (score) => score.actionId));
  }

  /**
   * Dérive le contexte référentiel depuis les actionIds fournis :
   * - extrait les referentielIds depuis les actionIds valides
   * - guard mono-référentiel : si plusieurs, retourne failure
   * - lit la version courante du référentiel trouvé
   */
  private async deriveReferentielContext(
    actionIds: string[]
  ): Promise<
    Result<{ referentielId: string; version: string }, ScoreIndicatifError>
  > {
    const referentielIds = new Set<string>();
    for (const actionId of actionIds) {
      try {
        referentielIds.add(getReferentielIdFromActionId(actionId));
      } catch {
        // ignore les actionIds mal formés
      }
    }

    if (referentielIds.size > 1) {
      this.logger.warn(
        `Actions de référentiels mixtes : ${[...referentielIds].join(', ')}`
      );
      return failure(ScoreIndicatifErrorEnum.MIXED_REFERENTIELS);
    }

    const referentielId =
      referentielIds.size === 1 ? [...referentielIds][0] : 'te';

    const refDef =
      await this.getReferentielDefinitionService.getReferentielDefinition(
        referentielId as any
      );

    return success({ referentielId, version: refDef.version });
  }

  /** Liste les indicateurs associés aux actions pour le calcul du score indicatif  */
  private async getIndicateursAssocies(input: {
    collectiviteId: number;
    formules: Formule[];
  }): Promise<
    Result<
      {
        indicateursAssocies: IndicateurAssocie[];
        identiteCollectivite: CollectiviteAvecType;
      },
      ScoreIndicatifError
    >
  > {
    const indicateursParActionId: Record<string, ReferencedIndicateur[]> = {};
    const identifiantReferentielList: string[] = [];
    input.formules.forEach(({ actionId, exprScore }) => {
      if (exprScore) {
        const indicateurs =
          this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
            exprScore
          );
        indicateursParActionId[actionId] = indicateurs;
        identifiantReferentielList.push(
          ...indicateurs.map((ind) => ind.identifiant)
        );
      }
    });

    const indicateursResult =
      await this.repository.getIndicateurDefinitionsByIdentifiants(
        identifiantReferentielList
      );
    if (!indicateursResult.success) {
      return failure(indicateursResult.error);
    }

    // identité de la collectivité
    const identiteCollectivite =
      await this.collectivitesService.getCollectiviteAvecType(
        input.collectiviteId
      );

    const indicateursFiltres = filterIndicateursByLocalisation(
      indicateursResult.data,
      identiteCollectivite
    );

    const { indicateursAssocies, identifiantsManquants } =
      buildIndicateursAssocies(indicateursParActionId, indicateursFiltres);
    identifiantsManquants.forEach(({ actionId, identifiant }) => {
      this.logger.log(
        `Indicateur absent pour l'identifiant ${identifiant} lié à l'action ${actionId}`
      );
    });

    return success({ indicateursAssocies, identiteCollectivite });
  }

  /** Liste les valeurs d'indicateurs utilisées pour le calcul du score indicatif */
  async getValeursUtiliseesParActionId(
    input: GetScoreIndicatifRequest
  ): Promise<Result<Record<string, ValeurUtilisee[]>, ScoreIndicatifError>> {
    return this.repository.listValeursUtiliseesParActionId(input);
  }

  /** Charge et agrège les données nécessaires au calcul */
  private async getEvaluationContext(
    input: GetScoreIndicatifRequest,
    indicateursAssocies: IndicateurAssocie[],
    identiteCollectivite: CollectiviteAvecType,
    referentielContext: { referentielId: string; version: string }
  ) {
    // réponses aux questions de personnalisation
    const personnalisationReponses =
      await this.personnalisationsService.getPersonnalisationReponses(
        input.collectiviteId
      );

    // valeurs de référence (cible/limite)
    const valeursCible: Array<[string, number]> = [];
    const valeursLimite: Array<[string, number]> = [];
    const indicateurIds = indicateursAssocies.map(
      ({ indicateurId }) => indicateurId
    );
    const valeursReference =
      await this.valeursReferenceService.getValeursReference({
        indicateurIds,
        collectiviteId: input.collectiviteId,
        collectiviteAvecType: identiteCollectivite,
        personnalisationReponses,
        referentielContext: {
          referentielId: referentielContext.referentielId as any,
          version: referentielContext.version,
        },
      });
    indicateursAssocies.forEach(({ identifiantReferentiel }) => {
      const reference = valeursReference.find(
        (v) => v?.identifiantReferentiel === identifiantReferentiel
      );
      if (reference && identifiantReferentiel) {
        if (reference.cible !== null) {
          valeursCible.push([identifiantReferentiel, reference.cible]);
        }
        if (reference.seuil !== null) {
          valeursLimite.push([identifiantReferentiel, reference.seuil]);
        }
      }
    });

    const evaluationContext: EvaluationContext = {
      identiteCollectivite,
      reponses: personnalisationReponses,
      valeursComplementaires: {
        cible: Object.fromEntries(valeursCible),
        limite: Object.fromEntries(valeursLimite),
      },
    };

    return evaluationContext;
  }

  /** Calcule le score programmé ou fait */
  private computeScore(
    actionId: string,
    exprScore: string,
    valeursParTypeScore: Record<ScoreIndicatifType, ValeurUtilisee[]>,
    indicateursAssocies: IndicateurAssocie[],
    typeScore: ScoreIndicatifType,
    evaluationContext: EvaluationContext
  ) {
    const valeursUtilisees = valeursParTypeScore[typeScore] || [];

    // Si aucune valeur présente, log et retourne null
    if (valeursUtilisees.length === 0) {
      this.logger.log(
        `Valeur(s) manquante(s) pour le calcul du score indicatif ${typeScore} de l'action ${actionId}`
      );
      return null;
    }

    const valeurs = buildValeursPourExpression(
      valeursUtilisees,
      indicateursAssocies
    );

    const score = this.indicateurExpressionService.parseAndEvaluateExpression(
      exprScore,
      valeurs,
      evaluationContext
    );
    if (score === null) {
      this.logger.log(
        `Le score indicatif ${typeScore} de l'action ${actionId} n'a pas pû être calculé`
      );
      return null;
    }

    return {
      score,
      valeursUtilisees: pickValeursUtiliseesPourResultat(valeursUtilisees),
    };
  }

  /**
   * Calcule et formate les scores indicatifs pour toutes les actions ayant une formule
   */
  async getScoresIndicatifsForPayload(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<
    Result<
      Array<{ actionId: string; score: ScoreIndicatifPayload }>,
      ScoreIndicatifError
    >
  > {
    const actionIdsResult =
      await this.repository.extractActionIdsWithExprScore();
    if (!actionIdsResult.success) {
      return failure(actionIdsResult.error);
    }
    const actionIds = actionIdsResult.data.filter((actionId) =>
      actionBelongsToReferentiel(actionId, referentielId)
    );
    if (!actionIds.length) {
      return success([]);
    }

    const result = await this.getScoreIndicatif({ collectiviteId, actionIds });
    if (!result.success) {
      this.logger.warn(
        `Impossible de calculer les scores indicatifs : ${result.error}`
      );
      return success([]);
    }
    const scores = result.data;
    const scoresPourPayload = Object.entries(scores)
      .map(([actionId, score]) => ({
        actionId,
        score: formatScoreIndicatifForPayload(score),
      }))
      .filter(({ score }) => score.fait || score.programme);

    return success(scoresPourPayload);
  }
}
