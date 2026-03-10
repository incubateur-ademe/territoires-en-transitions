import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, desc, eq, lte, SQL, SQLWrapper } from 'drizzle-orm';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils/database/database.service';
import { historiqueReponseBinaireTable } from '../models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from '../models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from '../models/historique-reponse-proportion.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';

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
}
