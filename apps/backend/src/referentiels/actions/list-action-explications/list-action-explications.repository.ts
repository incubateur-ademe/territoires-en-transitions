import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ReferentielId } from '@tet/domain/referentiels';
import { and, asc, desc, eq, like, lte, SQL, SQLWrapper } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { actionCommentaireTable } from '../../models/action-commentaire.table';
import { GetActionStatutExplicationsResponseType } from '../../models/get-action-statut-explications.response';
import { historiqueActionCommentaireTable } from '../../models/historique-action-commentaire.table';

interface ListActionExplicationsInput {
  referentielId: ReferentielId;
  collectiviteId: number;
  date?: string;
}

@Injectable()
export class ListActionExplicationsRepository {
  private readonly logger = new Logger(ListActionExplicationsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async execute({
    referentielId,
    collectiviteId,
    date,
  }: ListActionExplicationsInput): Promise<GetActionStatutExplicationsResponseType> {
    const actionStatutsExplications: GetActionStatutExplicationsResponseType =
      {};

    this.logger.log(
      `Getting collectivite ${collectiviteId} action statut explications for referentiel ${referentielId} and date ${date}`
    );

    const table = date
      ? historiqueActionCommentaireTable
      : actionCommentaireTable;

    const actionStatutsConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectiviteId, collectiviteId),
      like(table.actionId, `${referentielId}%`),
    ];
    if (date) {
      const endOfTheDay = DateTime.fromISO(date).endOf('day').toUTC().toISO();
      actionStatutsConditions.push(lte(table.modifiedAt, endOfTheDay ?? date));
    }

    const referentielActionStatutExplications = await this.databaseService.db
      .select({
        actionId: table.actionId,
        explication: date
          ? historiqueActionCommentaireTable.precision
          : actionCommentaireTable.commentaire,
        modifiedAt: table.modifiedAt,
      })
      .from(table)
      .where(and(...actionStatutsConditions))
      .orderBy(desc(table.modifiedAt), asc(table.actionId));

    this.logger.log(
      `${referentielActionStatutExplications.length} action statut explications trouves pour le referentiel ${referentielId} et la collectivite ${collectiviteId}`
    );
    this.logger.log(
      `Dernière modification de statut: ${
        referentielActionStatutExplications.length
          ? referentielActionStatutExplications[0]?.modifiedAt
          : 'N/A'
      }`
    );

    referentielActionStatutExplications.forEach((actionStatutExplication) => {
      if (!actionStatutsExplications[actionStatutExplication.actionId]) {
        actionStatutsExplications[actionStatutExplication.actionId] = {
          explication: actionStatutExplication.explication,
        };
      }
    });

    return actionStatutsExplications;
  }
}
