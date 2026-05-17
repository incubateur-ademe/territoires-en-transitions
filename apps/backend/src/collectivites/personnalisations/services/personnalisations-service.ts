import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, desc, eq, lte, SQL, SQLWrapper } from 'drizzle-orm';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils/database/database.service';
import { historiqueReponseBinaireTable } from '../models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from '../models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from '../models/historique-reponse-proportion.table';
import { PersonnalisationReponsesEffectivesRepository } from './personnalisation-reponses-effectives.repository';

type HistoriqueReponseTables =
  | typeof historiqueReponseBinaireTable
  | typeof historiqueReponseChoixTable
  | typeof historiqueReponseProportionTable;

@Injectable()
export default class PersonnalisationsService {
  private readonly logger = new Logger(PersonnalisationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly personnalisationReponsesEffectivesRepository: PersonnalisationReponsesEffectivesRepository
  ) {}

  private async getPersonnalisationReponsesForTable(
    table: HistoriqueReponseTables,
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
    table: HistoriqueReponseTables,
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
    tokenInfo?: AuthenticatedUser,
    tx?: Transaction
  ): Promise<PersonnalisationReponsesPayload> {
    this.logger.log(
      `Getting responses for collectivite ${collectiviteId} and date ${reponsesDate}`
    );

    // Cas courant : réponses effectives (réponses explicites de la collectivité
    // + réponses déduites des compétences exercées).
    if (!reponsesDate) {
      if (tx) {
        return this.personnalisationReponsesEffectivesRepository.getReponsesEffectivesPayload(
          collectiviteId,
          tx
        );
      }
      return this.databaseService.db.transaction((transaction) =>
        this.personnalisationReponsesEffectivesRepository.getReponsesEffectivesPayload(
          collectiviteId,
          transaction
        )
      );
    }

    // Historique : tables historique_* uniquement — pas de coalesce compétence
    const reponses: PersonnalisationReponsesPayload = {};

    // Seulement les personnes ayant l'accès en lecture à la collectivité peuvent voir les réponses historiques
    if (tokenInfo) {
      await this.permissionService.isAllowed(
        tokenInfo,
        'referentiels.read_confidentiel',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    await this.fillPersonnalisationReponsesForTable(
      historiqueReponseChoixTable,
      collectiviteId,
      reponses,
      reponsesDate
    );

    await this.fillPersonnalisationReponsesForTable(
      historiqueReponseBinaireTable,
      collectiviteId,
      reponses,
      reponsesDate
    );

    await this.fillPersonnalisationReponsesForTable(
      historiqueReponseProportionTable,
      collectiviteId,
      reponses,
      reponsesDate
    );

    return reponses;
  }
}
