import { Injectable, Logger } from '@nestjs/common';
import { GetPersonnalisationConsequencesRequestType } from '@tet/backend/collectivites/personnalisations/models/get-personnalisation-consequences.request';
import { GetPersonnalisationReglesResponseType } from '@tet/backend/collectivites/personnalisations/models/get-personnalisation-regles.response';
import { PersonnalisationConsequencesByActionId } from '@tet/backend/collectivites/personnalisations/models/personnalisation-consequence.dto';
import { personnalisationRegleTable } from '@tet/backend/collectivites/personnalisations/models/personnalisation-regle.table';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  CollectiviteAvecType,
  IdentiteCollectivite,
  PersonnalisationReponsesPayload,
  PersonnalisationRegle,
} from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, asc, like, SQL, SQLWrapper } from 'drizzle-orm';
import PersonnalisationsExpressionService from './personnalisations-expression.service';
import PersonnalisationsService from './personnalisations-service';

export type GetPersonnalisationConsequencesForCollectiviteOptions = {
  reponsesDejaChargees?: PersonnalisationReponsesPayload;
};

@Injectable()
export class PersonnalisationConsequencesService {
  private readonly logger = new Logger(
    PersonnalisationConsequencesService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectivitesService: CollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly personnalisationsService: PersonnalisationsService
  ) {}

  async getPersonnalisationRegles(
    actionId?: string
  ): Promise<GetPersonnalisationReglesResponseType> {
    const reglesQuery = this.databaseService.db
      .select()
      .from(personnalisationRegleTable);

    const conditions: (SQLWrapper | SQL)[] = [];

    if (actionId) {
      conditions.push(
        like(personnalisationRegleTable.actionId, `${actionId}%`)
      );
    }

    let regles: PersonnalisationRegle[];
    if (conditions.length) {
      regles = await this.databaseService.db
        .select()
        .from(personnalisationRegleTable)
        .where(and(...conditions))
        .orderBy(asc(personnalisationRegleTable.actionId));
    } else {
      regles = await reglesQuery.orderBy(
        asc(personnalisationRegleTable.actionId)
      );
    }

    this.logger.log(`${regles.length} regles trouvees`);
    return { regles };
  }

  async getPersonnalisationConsequencesForCollectivite(
    collectiviteId: number,
    request: GetPersonnalisationConsequencesRequestType,
    tokenInfo?: AuthenticatedUser,
    collectiviteInfo?: CollectiviteAvecType,
    options?: GetPersonnalisationConsequencesForCollectiviteOptions
  ): Promise<{
    reponses: PersonnalisationReponsesPayload;
    consequences: PersonnalisationConsequencesByActionId;
  }> {
    if (request.date && tokenInfo) {
      await this.permissionService.isAllowed(
        tokenInfo,
        'referentiels.read_confidentiel',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    if (!collectiviteInfo) {
      collectiviteInfo =
        await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
    }

    const reponses =
      options?.reponsesDejaChargees ??
      (await this.personnalisationsService.getPersonnalisationReponses(
        collectiviteId,
        request.date,
        tokenInfo
      ));
    const regles = await this.getPersonnalisationRegles(request.referentiel);

    const consequences = await this.getPersonnalisationConsequences(
      regles,
      reponses,
      collectiviteInfo
    );
    return {
      reponses,
      consequences,
    };
  }

  async getPersonnalisationConsequences(
    regles: GetPersonnalisationReglesResponseType,
    reponses: PersonnalisationReponsesPayload,
    collectiviteInfo: IdentiteCollectivite
  ): Promise<PersonnalisationConsequencesByActionId> {
    const consequences: PersonnalisationConsequencesByActionId = {};

    regles.regles.forEach((regle) => {
      if (!consequences[regle.actionId]) {
        consequences[regle.actionId] = {
          desactive: null,
          scoreFormule: null,
          potentielPerso: null,
        };
      }
      if (regle.formule) {
        this.logger.debug(
          `Evaluation de la formule de type ${regle.type} pour l'action ${regle.actionId}: ${regle.formule}`
        );
        const evaluatedExpression =
          this.personnalisationsExpressionService.parseAndEvaluateExpression(
            regle.formule,
            reponses,
            collectiviteInfo
          );
        if (regle.type === 'score') {
          consequences[regle.actionId].scoreFormule =
            evaluatedExpression as string;
        } else if (regle.type === 'desactivation') {
          consequences[regle.actionId].desactive =
            evaluatedExpression as boolean;
        } else if (regle.type === 'reduction') {
          consequences[regle.actionId].potentielPerso =
            evaluatedExpression as number;
        }
      }
    });

    return consequences;
  }
}
