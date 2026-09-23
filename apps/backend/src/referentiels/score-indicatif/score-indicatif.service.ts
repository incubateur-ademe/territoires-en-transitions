import { Injectable, Logger } from '@nestjs/common';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import IndicateurExpressionService, {
  EvaluationContext,
} from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { GetValeursUtilisablesRequest } from '@tet/backend/referentiels/score-indicatif/get-valeurs-utilisables.request';
import {
  ScoreIndicatifError,
  ScoreIndicatifErrorEnum,
} from '@tet/backend/referentiels/score-indicatif/score-indicatif.errors';
import { SetValeursUtiliseesRequest } from '@tet/backend/referentiels/score-indicatif/set-valeurs-utilisees.request';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  ActionScoreIndicatif,
  getReferentielIdFromActionId,
  IndicateurAssocie,
  ReferentielId,
  ScoreIndicatifActionValeurUtilisable,
  ScoreIndicatifPayload,
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { groupBy, keyBy } from 'es-toolkit';
import { BuildEvaluationContextService } from './build-evaluation-context.service';
import {
  buildValeursPourExpression,
  pickValeursUtiliseesPourResultat,
} from './compute-score-indicatif.rules';
import { GetIndicateursAssociesService } from './get-indicateurs-associes.service';
import { GetScoreIndicatifRequest } from './get-score-indicatif.request';
import {
  actionBelongsToReferentiel,
  formatScoreIndicatifForPayload,
} from './score-indicatif-payload.rules';
import { ScoreIndicatifRepository } from './score-indicatif.repository';
import { mapActionIdToValeurUtilisable } from './valeurs-utilisables.rules';

@Injectable()
export class ScoreIndicatifService {
  private readonly logger = new Logger(ScoreIndicatifService.name);

  constructor(
    private readonly repository: ScoreIndicatifRepository,
    private readonly transactionManager: TransactionManager,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly indicateurValeursService: CrudValeursService,
    private readonly permissionService: PermissionService,
    private readonly getIndicateursAssociesService: GetIndicateursAssociesService,
    private readonly buildEvaluationContextService: BuildEvaluationContextService
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

    const indicateursAssociesResult =
      await this.getIndicateursAssociesService.getIndicateursAssocies({
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

    return this.transactionManager.executeSingle(async (transaction) => {
      const validationResult = await this.validateValeursUtiliseesInput(
        input,
        { user, tx: transaction }
      );
      if (!validationResult.success) {
        return failure(validationResult.error, validationResult.cause);
      }

      return this.repository.replaceValeursUtiliseesForAction(
        input,
        transaction
      );
    }, tx);
  }

  /**
   * Vérifie, avant toute écriture, que l'action appartient bien au
   * référentiel attendu, que l'indicateur est associé à cette action (via sa
   * formule de score) et que les valeurs d'indicateur fournies appartiennent
   * bien à la collectivité et à l'indicateur donnés — évite qu'un appelant
   * ne rattache à son score des valeurs d'une autre collectivité ou d'un
   * autre indicateur.
   */
  private async validateValeursUtiliseesInput(
    input: SetValeursUtiliseesRequest,
    { user, tx }: { user: ServiceSecondArg['user']; tx: Transaction }
  ): Promise<Result<void, ScoreIndicatifError>> {
    const formulesResult = await this.repository.getFormules(
      [input.actionId],
      tx
    );
    if (!formulesResult.success) {
      return failure(formulesResult.error, formulesResult.cause);
    }
    const formule = formulesResult.data.find(
      (f) => f.actionId === input.actionId
    );
    if (!formule) {
      return failure(ScoreIndicatifErrorEnum.NOT_FOUND);
    }

    // Certaines actions du référentiel TE n'ont pas de formule de
    // score (`exprScore` vide) : la sélection d'une valeur y est tout de
    // même autorisée (le score reste alors non calculable), donc il n'y a
    // rien à vérifier contre une formule inexistante.
    if (formule.exprScore) {
      const indicateursAssociesResult =
        await this.getIndicateursAssociesService.getIndicateursAssocies(
          { collectiviteId: input.collectiviteId, formules: [formule] },
          { user, tx }
        );
      if (!indicateursAssociesResult.success) {
        return failure(
          indicateursAssociesResult.error,
          indicateursAssociesResult.cause
        );
      }
      const indicateurAssocie =
        indicateursAssociesResult.data.indicateursAssocies.find(
          (indicateur) => indicateur.indicateurId === input.indicateurId
        );
      if (!indicateurAssocie) {
        return failure(ScoreIndicatifErrorEnum.NOT_FOUND);
      }
    }

    const indicateurValeurIds = input.valeurs
      .map((v) => v.indicateurValeurId)
      .filter((id): id is number => id !== null);
    if (indicateurValeurIds.length) {
      const valeursTrouveesResult =
        await this.repository.filterIndicateurValeurIdsBelongingTo(
          indicateurValeurIds,
          input.collectiviteId,
          input.indicateurId,
          tx
        );
      if (!valeursTrouveesResult.success) {
        return failure(
          valeursTrouveesResult.error,
          valeursTrouveesResult.cause
        );
      }
      const valeursTrouvees = new Set(valeursTrouveesResult.data);
      const contientValeurInconnue = indicateurValeurIds.some(
        (id) => !valeursTrouvees.has(id)
      );
      if (contientValeurInconnue) {
        return failure(ScoreIndicatifErrorEnum.NOT_FOUND);
      }
    }

    return success(undefined);
  }

  /**
   * Calcule le score indicatif des actions à partir des indicateurs associés et
   * des valeurs/source/année sélectionnées
   */
  async getScoreIndicatif(
    input: GetScoreIndicatifRequest,
    // `tx` permet de calculer le score à partir de valeurs écrites dans la
    // même transaction, avant son commit
    { tx }: Pick<ServiceSecondArg, 'tx'> = {}
  ): Promise<
    Result<Record<string, ActionScoreIndicatif>, ScoreIndicatifError>
  > {
    const formulesResult = await this.repository.getFormules(
      input.actionIds,
      tx
    );
    if (!formulesResult.success) {
      return failure(formulesResult.error);
    }
    const formules = formulesResult.data;

    const valeursUtiliseesResult =
      await this.repository.listValeursUtiliseesParActionId(input, tx);
    if (!valeursUtiliseesResult.success) {
      return failure(valeursUtiliseesResult.error);
    }
    const valeursUtiliseesParActionId = valeursUtiliseesResult.data;

    const indicateursAssociesResult =
      await this.getIndicateursAssociesService.getIndicateursAssocies({
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

    const evaluationContextResult =
      await this.buildEvaluationContextService.buildEvaluationContext(
        input,
        formules.map((f) => f.actionId),
        indicateursAssocies,
        identiteCollectivite
      );
    if (!evaluationContextResult.success) {
      return failure(evaluationContextResult.error);
    }
    const evaluationContext = evaluationContextResult.data;

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

  /** Liste les valeurs d'indicateurs utilisées pour le calcul du score indicatif */
  async getValeursUtiliseesParActionId(
    input: GetScoreIndicatifRequest
  ): Promise<Result<Record<string, ValeurUtilisee[]>, ScoreIndicatifError>> {
    return this.repository.listValeursUtiliseesParActionId(input);
  }

  /** Liste les actions dont le score indicatif est calculé à partir des valeurs d'indicateurs */
  async getActionsUsingIndicateurValeur(
    indicateurValeurId: number | number[]
  ): Promise<
    Result<{ collectiviteId: number; actionId: string }[], ScoreIndicatifError>
  > {
    return this.repository.listActionsUsingIndicateurValeur(indicateurValeurId);
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
    // Si un des indicateurs associés est marqué "non applicable" par la
    // collectivité, le résultat est forcé à 0 sans évaluer la formule.
    // Injecter une valeur (même 0) dans la formule ne serait pas fiable :
    // beaucoup de formules comparent la valeur à un seuil/une cible
    // (`si val < cible alors 1 sinon 0`) où une valeur basse est souvent
    // "bonne" (ex. émissions, déchets) — forcer `val()` à 0 produirait
    // alors un score de 100% au lieu du 0% attendu.
    if (indicateursAssocies.some((indicateur) => !indicateur.isApplicable)) {
      return { score: 0, valeursUtilisees: [] };
    }

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
