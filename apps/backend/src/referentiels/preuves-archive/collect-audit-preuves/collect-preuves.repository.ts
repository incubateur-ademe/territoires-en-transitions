import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, sql } from 'drizzle-orm';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';

export interface CollectedFilePreuve {
  bucketId: string;
  hash: string;
  filename: string | null;
  filesize: number | null;
  actionId: ActionId | null;
}

export type MissingFilePreuve = Pick<
  CollectedFilePreuve,
  'hash' | 'filename' | 'actionId'
>;

export interface CollectedLinkPreuve {
  url: string;
  titre: string | null;
  commentaire: string | null;
  actionId: ActionId | null;
}

export type CollectedPreuves = {
  files: CollectedFilePreuve[];
  missingFiles: MissingFilePreuve[];
  links: CollectedLinkPreuve[];
};

type CollectedRow = Pick<CollectedFilePreuve, 'actionId' | 'filename'> & {
  fichierId: number | null;
  hash: string | null;
  url: string | null;
  titre: string | null;
  commentaire: string | null;
  fichier: {
    bucketId: string;
    filesize: number | null;
  } | null;
};

type TriagedPreuve =
  | { kind: 'file'; file: CollectedFilePreuve }
  | { kind: 'missingFile'; missingFile: MissingFilePreuve }
  | { kind: 'link'; link: CollectedLinkPreuve };

type PreuveKind =
  | 'complementaire'
  | 'reglementaire'
  | 'labellisation'
  | 'audit';

function triagePreuve(row: CollectedRow): TriagedPreuve[] {
  const { actionId, fichierId, hash, filename, fichier, url } = row;

  const isLinkPreuve = fichierId === null;
  if (isLinkPreuve) {
    if (!url) {
      return [];
    }
    return [
      {
        kind: 'link',
        link: {
          url,
          titre: row.titre,
          commentaire: row.commentaire,
          actionId,
        },
      },
    ];
  }

  const belongsToAnotherCollectivite = hash === null;
  if (belongsToAnotherCollectivite) {
    return [];
  }

  if (!fichier) {
    return [{ kind: 'missingFile', missingFile: { hash, filename, actionId } }];
  }

  return [
    {
      kind: 'file',
      file: {
        bucketId: fichier.bucketId,
        filesize: fichier.filesize,
        hash,
        filename,
        actionId,
      },
    },
  ];
}

function splitByKind(rows: CollectedRow[]): CollectedPreuves {
  const triaged = rows.flatMap(triagePreuve);

  return {
    files: triaged.flatMap((entry) =>
      entry.kind === 'file' ? [entry.file] : []
    ),
    missingFiles: triaged.flatMap((entry) =>
      entry.kind === 'missingFile' ? [entry.missingFile] : []
    ),
    links: triaged.flatMap((entry) =>
      entry.kind === 'link' ? [entry.link] : []
    ),
  };
}

@Injectable()
export class CollectPreuvesRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(CollectPreuvesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async getComplementairePreuves(input: {
    collectiviteId: number;
    referentielId: ReferentielId;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, referentielId, canReadConfidentiel } = input;
    const fichier = buildFichierSubquery(this.db);

    try {
      const rows = await this.db
        .select({
          actionId: preuveComplementaireTable.actionId,
          fichierId: preuveComplementaireTable.fichierId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          url: preuveComplementaireTable.url,
          titre: preuveComplementaireTable.titre,
          commentaire: preuveComplementaireTable.commentaire,
          fichier: buildFileInfoSql(fichier),
        })
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
          and(
            eq(preuveComplementaireTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
        .where(
          and(
            eq(preuveComplementaireTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveComplementaireTable.fichierId,
              confidentielColumn: bibliothequeFichierTable.confidentiel,
              canReadConfidentiel,
            })
          )
        );

      return success(splitByKind(rows));
    } catch (error) {
      return this.collectFailure('complementaire', error);
    }
  }

  async getReglementairePreuves(input: {
    collectiviteId: number;
    referentielId: ReferentielId;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, referentielId, canReadConfidentiel } = input;
    const fichier = buildFichierSubquery(this.db);

    try {
      const rows = await this.db
        .select({
          actionId: preuveActionTable.actionId,
          fichierId: preuveReglementaireTable.fichierId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          url: preuveReglementaireTable.url,
          titre: preuveReglementaireTable.titre,
          commentaire: preuveReglementaireTable.commentaire,
          fichier: buildFileInfoSql(fichier),
        })
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
          and(
            eq(preuveReglementaireTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
        .where(
          and(
            eq(preuveReglementaireTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveReglementaireTable.fichierId,
              confidentielColumn: bibliothequeFichierTable.confidentiel,
              canReadConfidentiel,
            })
          )
        );

      return success(splitByKind(rows));
    } catch (error) {
      return this.collectFailure('reglementaire', error);
    }
  }

  async getLabellisationPreuves(input: {
    collectiviteId: number;
    demandeId: number;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, demandeId, canReadConfidentiel } = input;
    const fichier = buildFichierSubquery(this.db);

    try {
      const rows = await this.db
        .select({
          actionId: sql<null>`null`,
          fichierId: preuveLabellisationTable.fichierId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          url: preuveLabellisationTable.url,
          titre: preuveLabellisationTable.titre,
          commentaire: preuveLabellisationTable.commentaire,
          fichier: buildFileInfoSql(fichier),
        })
        .from(preuveLabellisationTable)
        .leftJoin(
          bibliothequeFichierTable,
          and(
            eq(preuveLabellisationTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
        .where(
          and(
            eq(preuveLabellisationTable.demandeId, demandeId),
            eq(preuveLabellisationTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveLabellisationTable.fichierId,
              confidentielColumn: bibliothequeFichierTable.confidentiel,
              canReadConfidentiel,
            })
          )
        );

      return success(splitByKind(rows));
    } catch (error) {
      return this.collectFailure('labellisation', error);
    }
  }

  async getAuditPreuves(input: {
    collectiviteId: number;
    auditId: number;
    canReadConfidentiel: boolean;
  }): Promise<Result<CollectedPreuves, PreuvesArchiveError>> {
    const { collectiviteId, auditId, canReadConfidentiel } = input;
    const fichier = buildFichierSubquery(this.db);

    try {
      const rows = await this.db
        .select({
          actionId: sql<null>`null`,
          fichierId: preuveAuditTable.fichierId,
          hash: bibliothequeFichierTable.hash,
          filename: bibliothequeFichierTable.filename,
          url: preuveAuditTable.url,
          titre: preuveAuditTable.titre,
          commentaire: preuveAuditTable.commentaire,
          fichier: buildFileInfoSql(fichier),
        })
        .from(preuveAuditTable)
        .leftJoin(
          bibliothequeFichierTable,
          and(
            eq(preuveAuditTable.fichierId, bibliothequeFichierTable.id),
            eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
          )
        )
        .leftJoin(fichier, eq(fichier.id, bibliothequeFichierTable.id))
        .where(
          and(
            eq(preuveAuditTable.auditId, auditId),
            eq(preuveAuditTable.collectiviteId, collectiviteId),
            hideConfidentielFilter({
              fichierIdColumn: preuveAuditTable.fichierId,
              confidentielColumn: bibliothequeFichierTable.confidentiel,
              canReadConfidentiel,
            })
          )
        );

      return success(splitByKind(rows));
    } catch (error) {
      return this.collectFailure('audit', error);
    }
  }

  private collectFailure(
    kind: PreuveKind,
    error: unknown
  ): Result<never, PreuvesArchiveError> {
    this.logger.error(
      `Failed to collect preuves ${kind}: ${getErrorMessage(error)}`
    );
    const cause =
      error instanceof Error ? error : new Error(getErrorMessage(error));
    return failure(PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR, cause);
  }
}
