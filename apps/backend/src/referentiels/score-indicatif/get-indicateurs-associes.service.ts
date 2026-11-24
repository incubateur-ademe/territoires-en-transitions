import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
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
    ctx?: Pick<ServiceSecondArg, 'tx'>
  ): Promise<
    Result<
      {
        indicateursAssocies: IndicateurAssocie[];
        // indicateurs référencés par formule, avant résolution en base :
        // conserve les `tokens` (val/opt_val/cible/limite/est_suivi) déjà
        // extraits par le parseur, pour éviter de reparser `exprScore`
        // dans les services en aval
        indicateursParActionId: Record<string, ReferencedIndicateur[]>;
        identiteCollectivite: CollectiviteAvecType;
      },
      ScoreIndicatifError
    >
  > {
    const indicateursParActionId: Record<string, ReferencedIndicateur[]> = {};
    const identifiantReferentielList: string[] = [];

    for (const { actionId, exprScore } of input.formules) {
      if (!exprScore) continue;
      const indicateurs =
        this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          exprScore
        );
      if (!indicateurs.success) {
        return failure(
          ScoreIndicatifErrorEnum.INDICATEUR_EXPRESSION_ERROR,
          indicateurs.cause
        );
      }
      indicateursParActionId[actionId] = indicateurs.data;
      identifiantReferentielList.push(
        ...indicateurs.data.map((ind) => ind.identifiant)
      );
    }

    const indicateursResult =
      await this.repository.getIndicateurDefinitionsByIdentifiants(
        identifiantReferentielList,
        input.collectiviteId,
        ctx?.tx
      );
    if (!indicateursResult.success) {
      return failure(indicateursResult.error, indicateursResult.cause);
    }

    const collectiviteResult =
      await this.collectivitesService.getCollectiviteAvecType(
        input.collectiviteId
      );
    if (!collectiviteResult.success) {
      return failure(
        ScoreIndicatifErrorEnum.COLLECTIVITE_LOAD_ERROR,
        collectiviteResult.cause
      );
    }
    const identiteCollectivite = collectiviteResult.data;

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

    return success({
      indicateursAssocies,
      indicateursParActionId,
      identiteCollectivite,
    });
  }
}
