import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { isDemarcheDossierDocumentsComplet } from '@tet/domain/demarches';
import type {
  DemarcheType,
  DemarcheDocumentCouverture,
  DemarcheDocumentCouvertureSource,
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { and, asc, eq, sql } from 'drizzle-orm';
import { demarcheDocumentCouvertureTable } from './models/demarche-document-couverture.table';
import { demarcheDocumentDefinitionTable } from './models/demarche-document-definition.table';
import { demarcheDocumentSubstitutionTable } from './models/demarche-document-substitution.table';
import { demarcheDocumentTable } from './models/demarche-document.table';

/** Fichier de la bibliothèque, avec ce que le stockage sait de son type. */
export type DemarcheDocumentFichierRef = {
  id: number;
  filename: string;
  hash: string;
  bucketId: string | null;
  filesize: number | null;
  mimeType: string | null;
};

/**
 * Accès aux documents d'une démarche : le catalogue attendu pour son type et ce
 * qui a été déposé. Le snapshot est partagé par la lecture
 * et par le guard `dossierComplet` du workflow, pour que la règle de couverture
 * s'applique aux mêmes données des deux côtés.
 */
@Injectable()
export class DemarcheDocumentsRepository {
  private readonly logger = new Logger(DemarcheDocumentsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Catalogue des pièces attendues pour un type de démarche, substitutions
   * agrégées, trié par ordre d'affichage.
   */
  async listDefinitions(
    demarcheType: DemarcheType,
    tx?: Transaction
  ): Promise<DemarcheDocumentDefinition[]> {
    const db = tx || this.databaseService.db;

    const [definitions, substitutions] = await Promise.all([
      db
        .select({
          id: demarcheDocumentDefinitionTable.id,
          nom: demarcheDocumentDefinitionTable.nom,
          description: demarcheDocumentDefinitionTable.description,
          requis: demarcheDocumentDefinitionTable.requis,
          ordre: demarcheDocumentDefinitionTable.ordre,
          portee: demarcheDocumentDefinitionTable.portee,
          couverturePlateforme:
            demarcheDocumentDefinitionTable.couverturePlateforme,
        })
        .from(demarcheDocumentDefinitionTable)
        .where(eq(demarcheDocumentDefinitionTable.demarcheType, demarcheType))
        .orderBy(asc(demarcheDocumentDefinitionTable.ordre)),
      db
        .select({
          documentId: demarcheDocumentSubstitutionTable.documentId,
          substitutId: demarcheDocumentSubstitutionTable.substitutId,
        })
        .from(demarcheDocumentSubstitutionTable),
    ]);

    const substitutsByDocumentId = new Map<string, string[]>();
    for (const { documentId, substitutId } of substitutions) {
      const substituts = substitutsByDocumentId.get(documentId) ?? [];
      substituts.push(substitutId);
      substitutsByDocumentId.set(documentId, substituts);
    }

    return definitions.map((definition) => ({
      ...definition,
      couverturePlateforme: definition.couverturePlateforme ?? null,
      substituts: substitutsByDocumentId.get(definition.id) ?? [],
    }));
  }

  async findDefinition(
    demarcheType: DemarcheType,
    documentId: string,
    tx?: Transaction
  ): Promise<DemarcheDocumentDefinition | undefined> {
    const definitions = await this.listDefinitions(demarcheType, tx);
    return definitions.find((definition) => definition.id === documentId);
  }

  /**
   * État complet des documents d'une démarche. `planActionRattache` conditionne
   * la prise en compte des couvertures « comprises dans le plan d'actions ».
   */
  async loadSnapshot(
    {
      demarcheId,
      demarcheType,
      planActionId,
    }: {
      demarcheId: number;
      demarcheType: DemarcheType;
      planActionId: number | null;
    },
    tx?: Transaction
  ): Promise<DemarcheDocumentsSnapshot> {
    const [definitions, documents, couvertures] = await Promise.all([
      this.listDefinitions(demarcheType, tx),
      this.listDocuments(demarcheId, tx),
      this.listCouvertures(demarcheId, tx),
    ]);

    return {
      definitions,
      documents,
      couvertures,
      planActionRattache: planActionId !== null,
    };
  }

  /**
   * Dossier prêt au dépôt : programme d'actions rattaché et pièces requises
   * couvertes. La règle est la fonction pure du domaine, appliquée au même
   * snapshot que celui servi au front — les deux ne peuvent pas diverger.
   */
  async isDossierComplet(
    demarche: {
      id: number;
      type: DemarcheType;
      planActionId: number | null;
    },
    tx?: Transaction
  ): Promise<boolean> {
    if (demarche.planActionId === null) {
      return false;
    }
    const snapshot = await this.loadSnapshot(
      {
        demarcheId: demarche.id,
        demarcheType: demarche.type,
        planActionId: demarche.planActionId,
      },
      tx
    );
    return isDemarcheDossierDocumentsComplet(snapshot);
  }

  async listDocuments(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentDepose[]> {
    const db = tx || this.databaseService.db;

    const rows = await db
      .select({
        id: demarcheDocumentTable.id,
        documentId: demarcheDocumentTable.documentId,
        commentaire: demarcheDocumentTable.commentaire,
        modifiedAt: sqlToDateTimeISO(demarcheDocumentTable.modifiedAt),
        modifiedBy: demarcheDocumentTable.modifiedBy,
        fichierId: demarcheDocumentTable.fichierId,
        filename: bibliothequeFichierTable.filename,
        hash: bibliothequeFichierTable.hash,
        bucketId: collectiviteBucketTable.bucketId,
        filesize: sql<
          number | null
        >`(${storageObjectTable.metadata} ->> 'size')::int`,
      })
      .from(demarcheDocumentTable)
      .leftJoin(
        bibliothequeFichierTable,
        eq(demarcheDocumentTable.fichierId, bibliothequeFichierTable.id)
      )
      .leftJoin(
        collectiviteBucketTable,
        eq(
          bibliothequeFichierTable.collectiviteId,
          collectiviteBucketTable.collectiviteId
        )
      )
      .leftJoin(
        storageObjectTable,
        and(
          eq(storageObjectTable.bucketId, collectiviteBucketTable.bucketId),
          eq(storageObjectTable.name, bibliothequeFichierTable.hash)
        )
      )
      .where(eq(demarcheDocumentTable.demarcheId, demarcheId));

    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      commentaire: row.commentaire ?? '',
      modifiedAt: row.modifiedAt,
      modifiedBy: row.modifiedBy ?? null,
      fichier:
        row.fichierId !== null
          ? {
              id: row.fichierId,
              filename: row.filename ?? '',
              hash: row.hash ?? '',
              bucketId: row.bucketId ?? null,
              filesize: row.filesize ?? null,
            }
          : null,
    }));
  }

  async listCouvertures(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentCouverture[]> {
    const db = tx || this.databaseService.db;

    return db
      .select({
        documentId: demarcheDocumentCouvertureTable.documentId,
        source: demarcheDocumentCouvertureTable.source,
      })
      .from(demarcheDocumentCouvertureTable)
      .where(eq(demarcheDocumentCouvertureTable.demarcheId, demarcheId));
  }

  /**
   * Fichier de la bibliothèque appartenant à la collectivité. Le mime type est
   * lu dans les métadonnées du stockage (jointure externe : un fichier inséré
   * hors stockage reste trouvable, avec un type inconnu).
   */
  async findFichierForCollectivite(
    fichierId: number,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentFichierRef | undefined> {
    const db = tx || this.databaseService.db;

    const rows = await db
      .select({
        id: bibliothequeFichierTable.id,
        filename: bibliothequeFichierTable.filename,
        hash: bibliothequeFichierTable.hash,
        bucketId: collectiviteBucketTable.bucketId,
        filesize: sql<
          number | null
        >`(${storageObjectTable.metadata} ->> 'size')::int`,
        mimeType: sql<
          string | null
        >`${storageObjectTable.metadata} ->> 'mimetype'`,
      })
      .from(bibliothequeFichierTable)
      .leftJoin(
        collectiviteBucketTable,
        eq(
          bibliothequeFichierTable.collectiviteId,
          collectiviteBucketTable.collectiviteId
        )
      )
      .leftJoin(
        storageObjectTable,
        and(
          eq(storageObjectTable.bucketId, collectiviteBucketTable.bucketId),
          eq(storageObjectTable.name, bibliothequeFichierTable.hash)
        )
      )
      .where(
        and(
          eq(bibliothequeFichierTable.id, fichierId),
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      return undefined;
    }
    return {
      id: row.id,
      filename: row.filename ?? '',
      hash: row.hash ?? '',
      bucketId: row.bucketId ?? null,
      filesize: row.filesize ?? null,
      mimeType: row.mimeType ?? null,
    };
  }

  /** Dépose ou remplace la pièce : une seule par (démarche, définition). */
  async upsertDocument(
    values: {
      collectiviteId: number;
      demarcheId: number;
      documentId: string;
      fichierId: number;
      commentaire: string;
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<DemarcheDocumentDepose | undefined> {
    const db = tx || this.databaseService.db;

    const inserted = await db
      .insert(demarcheDocumentTable)
      .values({ ...values, modifiedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: [
          demarcheDocumentTable.demarcheId,
          demarcheDocumentTable.documentId,
        ],
        set: buildConflictUpdateColumns(demarcheDocumentTable, [
          'fichierId',
          'commentaire',
          'modifiedBy',
          'modifiedAt',
        ]),
      })
      .returning({ id: demarcheDocumentTable.id });

    if (inserted.length === 0) {
      return undefined;
    }
    const documents = await this.listDocuments(values.demarcheId, tx);
    return documents.find(({ id }) => id === inserted[0].id);
  }

  async deleteDocument(
    { demarcheId, documentId }: { demarcheId: number; documentId: string },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx || this.databaseService.db;

    const deleted = await db
      .delete(demarcheDocumentTable)
      .where(
        and(
          eq(demarcheDocumentTable.demarcheId, demarcheId),
          eq(demarcheDocumentTable.documentId, documentId)
        )
      )
      .returning({ id: demarcheDocumentTable.id });

    return deleted.length > 0;
  }

  async setCouverture(
    {
      demarcheId,
      documentId,
      source,
      couvert,
      createdBy,
    }: {
      demarcheId: number;
      documentId: string;
      source: DemarcheDocumentCouvertureSource;
      couvert: boolean;
      createdBy: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx || this.databaseService.db;

    if (!couvert) {
      await db
        .delete(demarcheDocumentCouvertureTable)
        .where(
          and(
            eq(demarcheDocumentCouvertureTable.demarcheId, demarcheId),
            eq(demarcheDocumentCouvertureTable.documentId, documentId),
            eq(demarcheDocumentCouvertureTable.source, source)
          )
        );
      return;
    }

    await db
      .insert(demarcheDocumentCouvertureTable)
      .values({ demarcheId, documentId, source, createdBy })
      .onConflictDoNothing();
  }
}
