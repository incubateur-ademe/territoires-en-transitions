import { AuthenticatedUser, AuthService, NiveauAcces } from '@/backend/auth';
import {
  CollectiviteAvecType,
  CollectivitesService,
  IdentiteCollectivite,
} from '@/backend/collectivites';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, asc, desc, eq, like, lte, SQL, SQLWrapper } from 'drizzle-orm';
import { GetPersonnalisationConsequencesRequestType } from '../get-personnalisation-consequences.request';
import { GetPersonnalitionConsequencesResponseType } from '../get-personnalisation-consequences.response';
import { GetPersonnalisationReglesResponseType } from '../get-personnalisation-regles.response';
import { GetPersonnalisationReponsesResponseType } from '../get-personnalisation-reponses.response';
import { historiqueReponseBinaireTable } from '../models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from '../models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from '../models/historique-reponse-proportion.table';
import {
  personnalisationRegleTable,
  PersonnalisationRegleType,
} from '../models/personnalisation-regle.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';
import ExpressionParserService from './expression-parser.service';

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
    private readonly expressionParserService: ExpressionParserService,
    private readonly authService: AuthService
  ) {}

  async getPersonnalisationReponsesForTable(
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

  async fillPersonnalisationReponsesForTable(
    table: ReponseTables,
    collectiviteId: number,
    reponses: GetPersonnalisationReponsesResponseType,
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
  ): Promise<GetPersonnalisationReponsesResponseType> {
    const reponses: GetPersonnalisationReponsesResponseType = {};

    this.logger.log(
      `Getting responses for collectivite ${collectiviteId} and date ${reponsesDate}`
    );

    // Seulement les personnes ayant l'accès en lecture à la collectivité peuvent voir les réponses historiques
    if (reponsesDate && tokenInfo) {
      await this.authService.verifieAccesAuxCollectivites(
        tokenInfo,
        [collectiviteId],
        NiveauAcces.LECTURE
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

    let regles: PersonnalisationRegleType[];
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
    reponses: GetPersonnalisationReponsesResponseType;
    consequences: GetPersonnalitionConsequencesResponseType;
  }> {
    // Seulement les personnes ayant l'accès en lecture à la collectivité peuvent voir les réponses historiques
    if (request.date && tokenInfo) {
      await this.authService.verifieAccesAuxCollectivites(
        tokenInfo,
        [collectiviteId],
        NiveauAcces.LECTURE
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
    reponses: GetPersonnalisationReponsesResponseType,
    collectiviteInfo: IdentiteCollectivite
  ): Promise<GetPersonnalitionConsequencesResponseType> {
    const consequences: GetPersonnalitionConsequencesResponseType = {};

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
          this.expressionParserService.parseAndEvaluateExpression(
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
