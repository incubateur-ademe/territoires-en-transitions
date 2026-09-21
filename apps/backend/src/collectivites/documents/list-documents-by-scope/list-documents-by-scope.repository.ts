import { Injectable, Logger } from '@nestjs/common';
import { excludeConfidentielRow } from '@tet/backend/collectivites/documents/confidentiel.utils';
import {
  buildFichierSubquery,
  buildFileInfoSql,
  type FichierSubquery,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ActionId } from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, SQL, sql } from 'drizzle-orm';
import { DocumentScope, DocumentScopeKind } from './document-scope';
import {
  ListDocumentsByScopeErrorEnum,
  type ListDocumentsByScopeError,
} from './list-documents-by-scope.errors';
import {
  CollectedDocuments,
  CollectedRow,
  triageDocuments,
} from './triage-documents';

type PreuveTable =
  | typeof preuveComplementaireTable
  | typeof preuveReglementaireTable
  | typeof preuveLabellisationTable
  | typeof preuveAuditTable;

type ScopeOf<Kind extends DocumentScopeKind> = Extract<
  DocumentScope,
  { kind: Kind }
>;

const buildNullActionId = () => sql<ActionId | null>`null`;

const buildSelection = <
  Table extends PreuveTable,
  ActionIdSelection extends
    | SQL<ActionId | null>
    | typeof preuveActionTable.actionId
    | typeof preuveComplementaireTable.actionId
>(
  table: Table,
  actionId: ActionIdSelection,
  fichier: FichierSubquery
) => ({
  actionId,
  fichierId: table.fichierId,
  hash: bibliothequeFichierTable.hash,
  filename: bibliothequeFichierTable.filename,
  url: table.url,
  titre: table.titre,
  commentaire: table.commentaire,
  fichier: buildFileInfoSql(fichier),
});

const buildBibliothequeJoin = <Table extends PreuveTable>(
  table: Table,
  collectiviteId: number
) =>
  and(
    eq(table.fichierId, bibliothequeFichierTable.id),
    eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
  );

const buildConfidentielFilter = <Table extends PreuveTable>(
  table: Table,
  canReadConfidentiel: boolean
) =>
  excludeConfidentielRow({
    fichierIdColumn: table.fichierId,
    confidentielColumn: bibliothequeFichierTable.confidentiel,
    canReadConfidentiel,
  });

@Injectable()
export class ListDocumentsByScopeRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(ListDocumentsByScopeRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async listDocuments(
    scope: DocumentScope
  ): Promise<Result<CollectedDocuments, ListDocumentsByScopeError>> {
    try {
      const rows = await this.selectRows(scope);
      return success(triageDocuments(rows));
    } catch (error) {
      return this.readFailure(scope.kind, error);
    }
  }

  private selectRows(scope: DocumentScope): Promise<CollectedRow[]> {
    const fichier = buildFichierSubquery(this.db);

    switch (scope.kind) {
      case 'complementaire':
        return this.selectComplementaireRows(scope, fichier);
      case 'reglementaire':
        return this.selectReglementaireRows(scope, fichier);
      case 'labellisation':
        return this.selectLabellisationRows(scope, fichier);
      case 'audit':
        return this.selectAuditRows(scope, fichier);
    }
  }

  private selectComplementaireRows(
    scope: ScopeOf<'complementaire'>,
    fichier: FichierSubquery
  ): Promise<CollectedRow[]> {
    const { collectiviteId, referentielId, canReadConfidentiel } = scope;

    return this.db
      .select(
        buildSelection(
          preuveComplementaireTable,
          preuveComplementaireTable.actionId,
          fichier
        )
      )
      .from(preuveComplementaireTable)
      .innerJoin(
        actionDefinitionTable,
        and(
          eq(
            actionDefinitionTable.actionId,
            preuveComplementaireTable.actionId
          ),
          eq(actionDefinitionTable.referentielId, referentielId)
        )
      )
      .leftJoin(
        bibliothequeFichierTable,
        buildBibliothequeJoin(preuveComplementaireTable, collectiviteId)
      )
      .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
      .where(
        and(
          eq(preuveComplementaireTable.collectiviteId, collectiviteId),
          buildConfidentielFilter(
            preuveComplementaireTable,
            canReadConfidentiel
          )
        )
      );
  }

  private selectReglementaireRows(
    scope: ScopeOf<'reglementaire'>,
    fichier: FichierSubquery
  ): Promise<CollectedRow[]> {
    const { collectiviteId, referentielId, canReadConfidentiel } = scope;

    return this.db
      .select(
        buildSelection(
          preuveReglementaireTable,
          preuveActionTable.actionId,
          fichier
        )
      )
      .from(preuveReglementaireTable)
      .innerJoin(
        preuveActionTable,
        eq(preuveActionTable.preuveId, preuveReglementaireTable.preuveId)
      )
      .innerJoin(
        actionDefinitionTable,
        and(
          eq(actionDefinitionTable.actionId, preuveActionTable.actionId),
          eq(actionDefinitionTable.referentielId, referentielId)
        )
      )
      .leftJoin(
        bibliothequeFichierTable,
        buildBibliothequeJoin(preuveReglementaireTable, collectiviteId)
      )
      .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
      .where(
        and(
          eq(preuveReglementaireTable.collectiviteId, collectiviteId),
          buildConfidentielFilter(preuveReglementaireTable, canReadConfidentiel)
        )
      );
  }

  private selectLabellisationRows(
    scope: ScopeOf<'labellisation'>,
    fichier: FichierSubquery
  ): Promise<CollectedRow[]> {
    const { collectiviteId, demandeId, canReadConfidentiel } = scope;

    return this.db
      .select(
        buildSelection(preuveLabellisationTable, buildNullActionId(), fichier)
      )
      .from(preuveLabellisationTable)
      .leftJoin(
        bibliothequeFichierTable,
        buildBibliothequeJoin(preuveLabellisationTable, collectiviteId)
      )
      .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
      .where(
        and(
          eq(preuveLabellisationTable.demandeId, demandeId),
          eq(preuveLabellisationTable.collectiviteId, collectiviteId),
          buildConfidentielFilter(preuveLabellisationTable, canReadConfidentiel)
        )
      );
  }

  private selectAuditRows(
    scope: ScopeOf<'audit'>,
    fichier: FichierSubquery
  ): Promise<CollectedRow[]> {
    const { collectiviteId, auditId, canReadConfidentiel } = scope;

    return this.db
      .select(buildSelection(preuveAuditTable, buildNullActionId(), fichier))
      .from(preuveAuditTable)
      .leftJoin(
        bibliothequeFichierTable,
        buildBibliothequeJoin(preuveAuditTable, collectiviteId)
      )
      .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
      .where(
        and(
          eq(preuveAuditTable.auditId, auditId),
          eq(preuveAuditTable.collectiviteId, collectiviteId),
          buildConfidentielFilter(preuveAuditTable, canReadConfidentiel)
        )
      );
  }

  private readFailure(
    kind: DocumentScopeKind,
    error: unknown
  ): Result<never, ListDocumentsByScopeError> {
    this.logger.error(
      `Failed to list ${kind} documents: ${getErrorMessage(error)}`
    );
    const cause =
      error instanceof Error ? error : new Error(getErrorMessage(error));
    return failure(
      ListDocumentsByScopeErrorEnum.LIST_DOCUMENTS_BY_SCOPE_ERROR,
      cause
    );
  }
}
