import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { assertAnnualScoreIndicateurs } from './score-indicatif-periodicite.rules';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import { IndicateurAssocie } from '@tet/domain/referentiels';
import {
  buildIndicateursAssocies,
  filterIndicateursByLocalisation,
} from './indicateurs-associes.rules';
import {
  ScoreIndicatifError,
  ScoreIndicatifErrorEnum,
} from './score-indicatif.errors';
import {
  Formule,
  ScoreIndicatifRepository,
} from './score-indicatif.repository';

@Injectable()
export class GetIndicateursAssociesService {
  private readonly logger = new Logger(GetIndicateursAssociesService.name);

  constructor(
    private readonly repository: ScoreIndicatifRepository,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  /** Liste les indicateurs associés aux actions pour le calcul du score indicatif  */
  async getIndicateursAssocies(
    input: {
      collectiviteId: number;
      formules: Formule[];
    },
    ctx?: ServiceSecondArg
  ): Promise<
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

    try {
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
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.INDICATEUR_EXPRESSION_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    const indicateursResult =
      await this.repository.getIndicateurDefinitionsByIdentifiants(
        identifiantReferentielList,
        ctx?.tx
      );
    if (!indicateursResult.success) {
      return failure(indicateursResult.error, indicateursResult.cause);
    }

    let identiteCollectivite: CollectiviteAvecType;
    try {
      identiteCollectivite =
        await this.collectivitesService.getCollectiviteAvecType(
          input.collectiviteId
        );
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.COLLECTIVITE_LOAD_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

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

    try {
      assertAnnualScoreIndicateurs(indicateursAssocies);
    } catch (error) {
      return failure(
        ScoreIndicatifErrorEnum.INDICATEUR_PERIODICITE_NOT_SUPPORTED,
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return success({ indicateursAssocies, identiteCollectivite });
  }
}
