import { Injectable, Logger } from '@nestjs/common';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ActionStatut,
  ReferentielId,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  like,
  lte,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { DateTime } from 'luxon';
import { ActionStatutsByActionId } from '../../compute-score/action-statuts-by-action-id.dto';
import { actionStatutTable } from '../../models/action-statut.table';
import { historiqueActionStatutTable } from '../../models/historique-action-statut.table';
import { inferStatutDetailleAuPourcentageFromStatut } from '../../update-action-statut/action-statut-create-to-action-statut-in-database.adapter';

interface ListActionStatutsInput {
  referentielId: ReferentielId;
  collectiviteId: number;
  date?: string;
}

@Injectable()
export class ListActionStatutsRepository {
  private readonly logger = new Logger(ListActionStatutsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listByActionIds({
    referentielId,
    collectiviteId,
    date,
  }: ListActionStatutsInput): Promise<ActionStatutsByActionId> {
    const actionStatutsByActionId: ActionStatutsByActionId = {};

    this.logger.log(
      `Getting collectivite ${collectiviteId} action statuts for referentiel ${referentielId} and date ${date}`
    );

    const table = date ? historiqueActionStatutTable : actionStatutTable;

    const actionStatutsConditions: (SQLWrapper | SQL)[] = [
      eq(table.collectiviteId, collectiviteId),
      like(table.actionId, `${referentielId}%`),
    ];
    if (date) {
      const endOfTheDay = DateTime.fromISO(date).endOf('day').toUTC().toISO();
      actionStatutsConditions.push(lte(table.modifiedAt, endOfTheDay ?? date));
    }

    const referentielActionStatuts = await this.databaseService.db
      .select({
        ...getTableColumns(table),
        modifiedAt: sqlToDateTimeISO(table.modifiedAt),
      })
      .from(table)
      .where(and(...actionStatutsConditions))
      .orderBy(desc(table.modifiedAt), asc(table.actionId));

    this.logger.log(
      `${referentielActionStatuts.length} statuts trouves pour le referentiel ${referentielId} et la collectivite ${collectiviteId}`
    );
    this.logger.log(
      `Dernière modification de statut: ${
        referentielActionStatuts.length
          ? referentielActionStatuts[0]?.modifiedAt
          : 'N/A'
      }`
    );

    referentielActionStatuts.forEach((actionStatut) => {
      if (!actionStatutsByActionId[actionStatut.actionId]) {
        actionStatutsByActionId[actionStatut.actionId] = {
          ...actionStatut,
          avancementDetaille:
            patchBadStatutDetailleInDatabaseForStatutOtherThanDetailleAuPourcentage(
              actionStatut
            ),
        };
      }
    });

    return actionStatutsByActionId;
  }
}

function patchBadStatutDetailleInDatabaseForStatutOtherThanDetailleAuPourcentage(
  actionStatut: ActionStatut
) {
  if (
    actionStatut.avancement === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
  ) {
    return actionStatut.avancementDetaille;
  }
  return inferStatutDetailleAuPourcentageFromStatut(actionStatut.avancement);
}
