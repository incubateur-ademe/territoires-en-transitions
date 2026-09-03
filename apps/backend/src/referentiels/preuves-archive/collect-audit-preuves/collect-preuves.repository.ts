import { Injectable, Logger } from '@nestjs/common';
import {
  buildFichierSubquery,
  buildFileInfoSql,
  type FichierSubquery,
} from '@tet/backend/collectivites/documents/file-info.utils';
import { hideConfidentielFilter } from '@tet/backend/collectivites/documents/hide-confidentiel.utils';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { type PgColumn } from 'drizzle-orm/pg-core';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';

export interface CollectedFilePreuve {
  bucketId: string;
  hash: string;
  filename: string;
  filesize: number | null;
  actionId: string | null;
}

export interface CollectedLinkPreuve {
  url: string;
  titre: string | null;
  commentaire: string | null;
  actionId: string | null;
}

type CollectedPreuves = {
  files: CollectedFilePreuve[];
  links: CollectedLinkPreuve[];
};

type CollectedRow = {
  actionId: string | null;
  url: string | null;
  titre: string | null;
  commentaire: string | null;
  fichier: {
    bucketId: string;
    hash: string;
    filename: string;
    filesize: number | null;
  } | null;
};

const AUCUNE_MESURE = sql<string | null>`null`;

const splitFilesAndLinks = (rows: CollectedRow[]): CollectedPreuves => ({
  files: rows.flatMap((row) =>
    row.fichier ? [{ ...row.fichier, actionId: row.actionId }] : []
  ),
  links: rows.flatMap((row) =>
    !row.fichier && row.url
      ? [
          {
            url: row.url,
            titre: row.titre,
            commentaire: row.commentaire,
            actionId: row.actionId,
          },
        ]
      : []
  ),
});

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
          fichier,
          and(
            eq(preuveComplementaireTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveComplementaireTable.collectiviteId, collectiviteId),
            this.masqueLesConfidentiels(
              preuveComplementaireTable.fichierId,
              fichier,
              canReadConfidentiel
            )
          )
        );

      return success(splitFilesAndLinks(rows));
    } catch (error) {
      return this.echecDeCollecte('complémentaires', error);
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
          fichier,
          and(
            eq(preuveReglementaireTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveReglementaireTable.collectiviteId, collectiviteId),
            this.masqueLesConfidentiels(
              preuveReglementaireTable.fichierId,
              fichier,
              canReadConfidentiel
            )
          )
        );

      return success(splitFilesAndLinks(rows));
    } catch (error) {
      return this.echecDeCollecte('réglementaires', error);
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
          actionId: AUCUNE_MESURE,
          url: preuveLabellisationTable.url,
          titre: preuveLabellisationTable.titre,
          commentaire: preuveLabellisationTable.commentaire,
          fichier: buildFileInfoSql(fichier),
        })
        .from(preuveLabellisationTable)
        .leftJoin(
          fichier,
          and(
            eq(preuveLabellisationTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveLabellisationTable.demandeId, demandeId),
            eq(preuveLabellisationTable.collectiviteId, collectiviteId),
            this.masqueLesConfidentiels(
              preuveLabellisationTable.fichierId,
              fichier,
              canReadConfidentiel
            )
          )
        );

      return success(splitFilesAndLinks(rows));
    } catch (error) {
      return this.echecDeCollecte('de labellisation', error);
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
          actionId: AUCUNE_MESURE,
          url: preuveAuditTable.url,
          titre: preuveAuditTable.titre,
          commentaire: preuveAuditTable.commentaire,
          fichier: buildFileInfoSql(fichier),
        })
        .from(preuveAuditTable)
        .leftJoin(
          fichier,
          and(
            eq(preuveAuditTable.fichierId, fichier.id),
            eq(fichier.collectiviteId, collectiviteId)
          )
        )
        .where(
          and(
            eq(preuveAuditTable.auditId, auditId),
            eq(preuveAuditTable.collectiviteId, collectiviteId),
            this.masqueLesConfidentiels(
              preuveAuditTable.fichierId,
              fichier,
              canReadConfidentiel
            )
          )
        );

      return success(splitFilesAndLinks(rows));
    } catch (error) {
      return this.echecDeCollecte("d'audit", error);
    }
  }

  private masqueLesConfidentiels(
    fichierIdColumn: PgColumn,
    fichier: FichierSubquery,
    canReadConfidentiel: boolean
  ): SQL | undefined {
    return hideConfidentielFilter({
      fichierIdColumn,
      confidentielColumn: fichier.confidentiel,
      canReadConfidentiel,
    });
  }

  private echecDeCollecte(
    nature: string,
    error: unknown
  ): Result<never, PreuvesArchiveError> {
    this.logger.error(
      `Collecte des preuves ${nature}: ${getErrorMessage(error)}`
    );
    return failure(
      PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR,
      error instanceof Error ? error : new Error(getErrorMessage(error))
    );
  }
}
