import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireDefinitionTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire-definition.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, like, or, SQL, sql } from 'drizzle-orm';
import { actionDefinitionTable } from '../../models/action-definition.table';
import { ListMesureDocumentsErrorEnum } from './list-mesure-documents.errors';

type MesureScope = {
  collectiviteId: number;
  actionId: string;
  withSubActions?: boolean;
  canReadConfidentiel: boolean;
};

const mesureColumns = {
  action: {
    actionId: actionDefinitionTable.actionId,
    identifiant: actionDefinitionTable.identifiant,
  },
  modifiedByNom: createdByNom,
};

function buildMesureFilter({
  actionId,
  withSubActions,
}: Pick<MesureScope, 'actionId' | 'withSubActions'>): SQL | undefined {
  const mesure = eq(actionDefinitionTable.actionId, actionId);

  if (!withSubActions) {
    return mesure;
  }

  return or(mesure, like(actionDefinitionTable.actionId, `${actionId}.%`));
}

@Injectable()
export class ListMesureDocumentsRepository {
  private readonly logger = new Logger(ListMesureDocumentsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listAttendus(
    {
      collectiviteId,
      actionId,
      withSubActions,
      canReadConfidentiel,
    }: MesureScope,
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const rows = await db
        .select({
          ...getTableColumns(preuveReglementaireTable),
          fichier: buildFileInfoSql(fichier),
          preuveReglementaire: {
            ...getTableColumns(preuveReglementaireDefinitionTable),
          },
          ...mesureColumns,
          preuveType: sql<'reglementaire'>`'reglementaire'`,
        })
        .from(preuveActionTable)
        .innerJoin(
          preuveReglementaireDefinitionTable,
          eq(preuveReglementaireDefinitionTable.id, preuveActionTable.preuveId)
        )
        .innerJoin(
          actionDefinitionTable,
          and(
            eq(actionDefinitionTable.actionId, preuveActionTable.actionId),
            buildMesureFilter({ actionId, withSubActions })
          )
        )
        .leftJoin(
          preuveReglementaireTable,
          and(
            eq(
              preuveReglementaireTable.preuveId,
              preuveReglementaireDefinitionTable.id
            ),
            eq(preuveReglementaireTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          fichier,
          and(
            eq(preuveReglementaireTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          dcpTable,
          eq(preuveReglementaireTable.modifiedBy, dcpTable.id)
        )
        .where(
          hideConfidentielFilter({
            fichierIdColumn: preuveReglementaireTable.fichierId,
            confidentielColumn: fichier.confidentiel,
            canReadConfidentiel,
          })
        )
        .orderBy(
          actionDefinitionTable.actionId,
          preuveReglementaireDefinitionTable.nom,
          preuveReglementaireTable.id
        );
      return success(rows);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des documents attendus de la mesure ${actionId} de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListMesureDocumentsErrorEnum.DATABASE_ERROR);
    }
  }

  async listComplementaires(
    {
      collectiviteId,
      actionId,
      withSubActions,
      canReadConfidentiel,
    }: MesureScope,
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    const fichier = buildFichierSubquery(db);

    try {
      const rows = await db
        .select({
          ...getTableColumns(preuveComplementaireTable),
          fichier: buildFileInfoSql(fichier),
          ...mesureColumns,
          preuveType: sql<'complementaire'>`'complementaire'`,
        })
        .from(preuveComplementaireTable)
        .innerJoin(
          actionDefinitionTable,
          and(
            eq(
              actionDefinitionTable.actionId,
              preuveComplementaireTable.actionId
            ),
            buildMesureFilter({ actionId, withSubActions })
          )
        )
        .leftJoin(
          fichier,
          and(
            eq(preuveComplementaireTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(
          dcpTable,
          eq(preuveComplementaireTable.modifiedBy, dcpTable.id)
        )
        .where(
          and(
            eq(preuveComplementaireTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveComplementaireTable.fichierId,
              confidentielColumn: fichier.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .orderBy(actionDefinitionTable.actionId, preuveComplementaireTable.id);
      return success(rows);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des documents complementaires de la mesure ${actionId} de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListMesureDocumentsErrorEnum.DATABASE_ERROR);
    }
  }
}
