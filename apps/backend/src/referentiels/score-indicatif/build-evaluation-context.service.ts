import { Injectable, Logger } from '@nestjs/common';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import { EvaluationContext } from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import ValeursReferenceService from '@tet/backend/indicateurs/valeurs/valeurs-reference.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import {
  getReferentielIdFromActionId,
  IndicateurAssocie,
  ReferentielId,
} from '@tet/domain/referentiels';
import { GetScoreIndicatifRequest } from './get-score-indicatif.request';
import {
  ScoreIndicatifError,
  ScoreIndicatifErrorEnum,
} from './score-indicatif.errors';

@Injectable()
export class BuildEvaluationContextService {
  private readonly logger = new Logger(BuildEvaluationContextService.name);

  constructor(
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly valeursReferenceService: ValeursReferenceService
  ) {}

  /** Charge et agrège les données nécessaires au calcul du score indicatif */
  async buildEvaluationContext(
    input: GetScoreIndicatifRequest,
    actionIds: string[],
    indicateursAssocies: IndicateurAssocie[],
    identiteCollectivite: CollectiviteAvecType,
    ctx?: ServiceSecondArg
  ): Promise<Result<EvaluationContext, ScoreIndicatifError>> {
    let referentielContextResult: Result<
      { referentielId: ReferentielId; version: string },
      ScoreIndicatifError
    >;
    try {
      referentielContextResult = await this.deriveReferentielContext(actionIds);
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.REFERENTIEL_DEFINITION_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
    if (!referentielContextResult.success) {
      return failure(
        referentielContextResult.error,
        referentielContextResult.cause
      );
    }
    const referentielContext = referentielContextResult.data;

    // réponses aux questions de personnalisation
    let personnalisationReponses;
    try {
      personnalisationReponses =
        await this.personnalisationsService.getPersonnalisationReponses(
          input.collectiviteId,
          undefined,
          ctx?.user,
          ctx?.tx
        );
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.PERSONNALISATION_REPONSES_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    // valeurs de référence (cible/limite)
    const valeursCible: Array<[string, number]> = [];
    const valeursLimite: Array<[string, number]> = [];
    const indicateurIds = indicateursAssocies.map(
      ({ indicateurId }) => indicateurId
    );
    let valeursReference;
    try {
      valeursReference = await this.valeursReferenceService.getValeursReference(
        {
          indicateurIds,
          collectiviteId: input.collectiviteId,
          collectiviteAvecType: identiteCollectivite,
          personnalisationReponses,
          referentielContext: {
            referentielId: referentielContext.referentielId,
            version: referentielContext.version,
          },
        }
      );
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.VALEURS_REFERENCE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
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

    return success(evaluationContext);
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
    Result<
      { referentielId: ReferentielId; version: string },
      ScoreIndicatifError
    >
  > {
    const referentielIds = new Set<ReferentielId>();
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

    const referentielId: ReferentielId =
      referentielIds.size === 1 ? [...referentielIds][0] : 'te';

    try {
      const refDef =
        await this.getReferentielDefinitionService.getReferentielDefinition(
          referentielId
        );

      return success({ referentielId, version: refDef.version });
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.REFERENTIEL_DEFINITION_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
