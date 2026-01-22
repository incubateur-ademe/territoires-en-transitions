import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  CollectiviteAvecType,
  IdentiteCollectivite,
  PersonnalisationRegle,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, asc, desc, eq, like, lte, SQL, SQLWrapper } from 'drizzle-orm';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils/database/database.service';
import CollectivitesService from '../../services/collectivites.service';
import { GetPersonnalisationConsequencesRequestType } from '../models/get-personnalisation-consequences.request';
import { GetPersonnalisationReglesResponseType } from '../models/get-personnalisation-regles.response';
import { historiqueReponseBinaireTable } from '../models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from '../models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from '../models/historique-reponse-proportion.table';
import { PersonnalisationConsequencesByActionId } from '../models/personnalisation-consequence.dto';
import { personnalisationRegleTable } from '../models/personnalisation-regle.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';
import PersonnalisationsExpressionService from './personnalisations-expression.service';

export type ReponseTables =
  | typeof reponseBinaireTable
  | typeof reponseChoixTable
  | typeof reponseProportionTable
  | typeof historiqueReponseBinaireTable
  | typeof historiqueReponseChoixTable
  | typeof historiqueReponseProportionTable;

@Injectable()
export default class PersonnalisationsService {
  private readonly logger = new Logger(PersonnalisationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectivitesService: CollectivitesService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly permissionService: PermissionService
  ) {}

  private async getPersonnalisationReponsesForTable(
    table: ReponseTables,
    collectiviteId: number,
    reponsesDate?: string
  ) {
    const reponsesConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectiviteId, collectiviteId),
    ];
    if (reponsesDate) {
      reponsesConditions.push(lte(table.modifiedAt, reponsesDate));
    }
    const reponses = await this.databaseService.db
      .select()
      .from(table)
      .where(and(...reponsesConditions))
      .orderBy(desc(table.modifiedAt));
    this.logger.log(
      `${reponses.length} reponses (table) pour la collectivite ${collectiviteId} et la date ${reponsesDate}`
    );
    return reponses;
  }

  private async fillPersonnalisationReponsesForTable(
    table: ReponseTables,
    collectiviteId: number,
    reponses: PersonnalisationReponsesPayload,
    reponsesDate?: string
  ): Promise<void> {
    const reponsesTable = await this.getPersonnalisationReponsesForTable(
      table,
      collectiviteId,
      reponsesDate
    );
    reponsesTable.forEach((row) => {
      // Si la question est déjà dans les réponses, on ne la remplace pas (ordonné par date de modification décroissante)
      if (!(row.questionId in reponses)) {
        reponses[row.questionId] = row.reponse;
      }
    });
  }

  async getPersonnalisationReponses(
    collectiviteId: number,
    reponsesDate?: string,
    tokenInfo?: AuthenticatedUser
  ): Promise<PersonnalisationReponsesPayload> {
    const reponses: PersonnalisationReponsesPayload = {};

    this.logger.log(
      `Getting responses for collectivite ${collectiviteId} and date ${reponsesDate}`
    );

    // Seulement les personnes ayant l'accès en lecture à la collectivité peuvent voir les réponses historiques
    if (reponsesDate && tokenInfo) {
      await this.permissionService.isAllowed(
        tokenInfo,
        'referentiels.read_confidentiel',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    // reponse choix
    await this.fillPersonnalisationReponsesForTable(
      reponsesDate ? historiqueReponseChoixTable : reponseChoixTable,
      collectiviteId,
      reponses,
      reponsesDate
    );

    // reponse binaires
    await this.fillPersonnalisationReponsesForTable(
      reponsesDate ? historiqueReponseBinaireTable : reponseBinaireTable,
      collectiviteId,
      reponses,
      reponsesDate
    );

    // reponses proportion
    await this.fillPersonnalisationReponsesForTable(
      reponsesDate ? historiqueReponseProportionTable : reponseProportionTable,
      collectiviteId,
      reponses,
      reponsesDate
    );

    return reponses;
  }

  async getPersonnalisationRegles(
    referentiel?: string
  ): Promise<GetPersonnalisationReglesResponseType> {
    const reglesQuery = this.databaseService.db
      .select()
      .from(personnalisationRegleTable);

    let regles: PersonnalisationRegle[];
    if (referentiel) {
      // TODO: add referentiel to personnalisationTable
      regles = await reglesQuery
        .where(like(personnalisationRegleTable.actionId, `${referentiel}%`))
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
    collectiviteInfo?: CollectiviteAvecType
  ): Promise<{
    reponses: PersonnalisationReponsesPayload;
    consequences: PersonnalisationConsequencesByActionId;
  }> {
    // Seulement les personnes ayant l'accès en lecture à la collectivité peuvent voir les réponses historiques
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
    const reponses = await this.getPersonnalisationReponses(
      collectiviteId,
      request.date
    );
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
