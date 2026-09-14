import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFichierJoin } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireDefinitionTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire-definition.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, getTableColumns, SQL, sql } from 'drizzle-orm';
import { matchesActionOrDescendant } from '../../action-or-descendant.utils';
import { actionDefinitionTable } from '../../models/action-definition.table';
import { ListDocumentsMesureErrorEnum } from './list-documents-mesure.errors';

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

const bibliothequeColumns = {
  bibliothequeFilename: bibliothequeFichierTable.filename,
};

function buildMesureFilter({
  actionId,
  withSubActions,
}: Pick<MesureScope, 'actionId' | 'withSubActions'>): SQL {
  if (!withSubActions) {
    return eq(actionDefinitionTable.actionId, actionId);
  }

  return matchesActionOrDescendant(actionDefinitionTable.actionId, actionId);
}

@Injectable()
export class ListDocumentsMesureRepository {
  private readonly logger = new Logger(ListDocumentsMesureRepository.name);

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
          ...bibliothequeColumns,
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
          bibliothequeFichierTable,
          and(
            eq(preuveReglementaireTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
            hideConfidentielFichierJoin({
              confidentielColumn: bibliothequeFichierTable.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
        .leftJoin(
          dcpTable,
          eq(preuveReglementaireTable.modifiedBy, dcpTable.id)
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
      return failure(ListDocumentsMesureErrorEnum.DATABASE_ERROR);
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
          ...bibliothequeColumns,
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
          bibliothequeFichierTable,
          and(
            eq(
              preuveComplementaireTable.fichierId,
              bibliothequeFichierTable.id
            ),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
            hideConfidentielFichierJoin({
              confidentielColumn: bibliothequeFichierTable.confidentiel,
              canReadConfidentiel,
            })
          )
        )
        .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
        .leftJoin(
          dcpTable,
          eq(preuveComplementaireTable.modifiedBy, dcpTable.id)
        )
        .where(eq(preuveComplementaireTable.collectiviteId, collectiviteId))
        .orderBy(actionDefinitionTable.actionId, preuveComplementaireTable.id);
      return success(rows);
    } catch (error) {
      this.logger.error(
        `Echec de la lecture des documents complementaires de la mesure ${actionId} de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ListDocumentsMesureErrorEnum.DATABASE_ERROR);
    }
  }
}
