import { Injectable, Logger } from '@nestjs/common';
import { and, asc, desc, eq, like, lte, SQL, SQLWrapper } from 'drizzle-orm';
import { NiveauAcces, SupabaseJwtPayload } from '../../auth/models/auth.models';
import { AuthService } from '../../auth/services/auth.service';
import { CollectiviteAvecType, IdentiteCollectivite } from '../../collectivites/models/collectivite.models';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import DatabaseService from '../../common/services/database.service';
import { GetPersonnalisationConsequencesRequestType } from '../models/get-personnalisation-consequences.request';
import { GetPersonnalitionConsequencesResponseType } from '../models/get-personnalisation-consequences.response';
import { GetPersonnalisationReglesResponseType } from '../models/get-personnalisation-regles.response';
import { GetPersonnalisationReponsesResponseType } from '../models/get-personnalisation-reponses.response';
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
    reponsesDate?: string,
  ) {
    const reponsesConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectivite_id, collectiviteId),
    ];
    if (reponsesDate) {
      reponsesConditions.push(lte(table.modified_at, reponsesDate));
    }
    const reponses = await this.databaseService.db
      .select()
      .from(table)
      .where(and(...reponsesConditions))
      .orderBy(desc(table.modified_at));
    this.logger.log(
      `${reponses.length} reponses (table) pour la collectivite ${collectiviteId} et la date ${reponsesDate}`,
    );
    return reponses;
  }

  async fillPersonnalisationReponsesForTable(
    table: ReponseTables,
    collectiviteId: number,
    reponses: GetPersonnalisationReponsesResponseType,
    reponsesDate?: string,
  ): Promise<void> {
    const reponsesTable = await this.getPersonnalisationReponsesForTable(
      table,
      collectiviteId,
      reponsesDate,
    );
    reponsesTable.forEach((row) => {
      // Si la question est déjà dans les réponses, on ne la remplace pas (ordonné par date de modification décroissante)
      if (!(row.question_id in reponses)) {
        reponses[row.question_id] = row.reponse;
      }
    });
  }

  async getPersonnalisationReponses(
    collectiviteId: number,
    reponsesDate?: string,
    tokenInfo?: SupabaseJwtPayload,
  ): Promise<GetPersonnalisationReponsesResponseType> {
    const reponses: GetPersonnalisationReponsesResponseType = {};

    this.logger.log(
      `Getting responses for collectivite ${collectiviteId} and date ${reponsesDate}`,
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
      reponsesDate,
    );

    // reponse binaires
    await this.fillPersonnalisationReponsesForTable(
      reponsesDate ? historiqueReponseBinaireTable : reponseBinaireTable,
      collectiviteId,
      reponses,
      reponsesDate,
    );

    // reponses proportion
    await this.fillPersonnalisationReponsesForTable(
      reponsesDate ? historiqueReponseProportionTable : reponseProportionTable,
      collectiviteId,
      reponses,
      reponsesDate,
    );

    return reponses;
  }

  async getPersonnalisationRegles(
    referentiel?: string,
  ): Promise<GetPersonnalisationReglesResponseType> {
    const reglesQuery = this.databaseService.db
      .select()
      .from(personnalisationRegleTable);

    let regles: PersonnalisationRegleType[];
    if (referentiel) {
      // TODO: add referentiel to personnalisationTable
      regles = await reglesQuery
        .where(like(personnalisationRegleTable.action_id, `${referentiel}%`))
        .orderBy(asc(personnalisationRegleTable.action_id));
    } else {
      regles = await reglesQuery.orderBy(
        asc(personnalisationRegleTable.action_id),
      );
    }

    this.logger.log(`${regles.length} regles trouvees`);
    return { regles };
  }

  async getPersonnalisationConsequencesForCollectivite(
    collectiviteId: number,
    request: GetPersonnalisationConsequencesRequestType,
    tokenInfo?: SupabaseJwtPayload,
    collectiviteInfo?: CollectiviteAvecType
  ): Promise<GetPersonnalitionConsequencesResponseType> {

    // Seulement les personnes ayant l'accès en lecture à la collectivité peuvent voir les réponses historiques
    if (request.date && tokenInfo) {
      await this.authService.verifieAccesAuxCollectivites(
        tokenInfo,
        [collectiviteId],
        NiveauAcces.LECTURE
      );
    }

    if (!collectiviteInfo) {
      collectiviteInfo = await this.collectivitesService.getCollectiviteAvecType(collectiviteId);
    }
    const reponses = await this.getPersonnalisationReponses(
      collectiviteId,
      request.date,
    );
    const regles = await this.getPersonnalisationRegles(request.referentiel);

    return this.getPersonnalisationConsequences(
      regles,
      reponses,
      collectiviteInfo,
    );
  }

  async getPersonnalisationConsequences(
    regles: GetPersonnalisationReglesResponseType,
    reponses: GetPersonnalisationReponsesResponseType,
    collectiviteInfo: IdentiteCollectivite,
  ): Promise<GetPersonnalitionConsequencesResponseType> {
    const consequences: GetPersonnalitionConsequencesResponseType = {};

    regles.regles.forEach((regle) => {
      if (!consequences[regle.action_id]) {
        consequences[regle.action_id] = {
          desactive: null,
          score_formule: null,
          potentiel_perso: null,
        };
      }
      if (regle.formule) {
        this.logger.log(
          `Evaluation de la formule de type ${regle.type} pour l'action ${regle.action_id}: ${regle.formule}`,
        );
        const evaluatedExpression =
          this.expressionParserService.parseAndEvaluateExpression(
            regle.formule,
            reponses,
            collectiviteInfo,
          );
        if (regle.type === 'score') {
          consequences[regle.action_id].score_formule =
            evaluatedExpression as string;
        } else if (regle.type === 'desactivation') {
          consequences[regle.action_id].desactive =
            evaluatedExpression as boolean;
        } else if (regle.type === 'reduction') {
          consequences[regle.action_id].potentiel_perso =
            evaluatedExpression as number;
        }
      }
    });

    return consequences;
  }
}
