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
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
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
    const db = tx ?? this.databaseService.db;

    const [definitions, substitutions] = await Promise.all([
      db
        .select({
          id: demarcheDocumentDefinitionTable.id,
          nom: demarcheDocumentDefinitionTable.nom,
          description: demarcheDocumentDefinitionTable.description,
          requis: demarcheDocumentDefinitionTable.requis,
          ordre: demarcheDocumentDefinitionTable.ordre,
          portee: demarcheDocumentDefinitionTable.portee,
          etape: demarcheDocumentDefinitionTable.etape,
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

  /** Catalogue attendu pour le type de démarche et pièces satisfaites. */
  async loadSnapshot(
    {
      demarcheId,
      demarcheType,
    }: {
      demarcheId: number;
      demarcheType: DemarcheType;
    },
    tx?: Transaction
  ): Promise<DemarcheDocumentsSnapshot> {
    const [definitions, documents] = await Promise.all([
      this.listDefinitions(demarcheType, tx),
      this.listDocuments(demarcheId, tx),
    ]);

    return { definitions, documents };
  }

  /**
   * Dossier prêt au dépôt : toutes les pièces requises sont satisfaites. La
   * règle est la fonction pure du domaine, appliquée au même snapshot que celui
   * servi au front — les deux ne peuvent pas diverger.
   */
  async isDocumentsComplet(
    demarche: { id: number; type: DemarcheType },
    tx?: Transaction
  ): Promise<boolean> {
    const snapshot = await this.loadSnapshot(
      { demarcheId: demarche.id, demarcheType: demarche.type },
      tx
    );
    return isDemarcheDossierDocumentsComplet(snapshot);
  }

  async listDocuments(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentDepose[]> {
    const db = tx ?? this.databaseService.db;

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
    const db = tx ?? this.databaseService.db;

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
    const db = tx ?? this.databaseService.db;

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
    const db = tx ?? this.databaseService.db;

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

  /**
   * Déclare (ou retire) la prise en charge d'une pièce par la plateforme : une
   * ligne sans fichier ni lien. Elle occupe la même place qu'un dépôt — les deux
   * modes de satisfaction d'une pièce sont exclusifs.
   *
   * Renvoie `false` quand la déclaration n'a pas été enregistrée parce qu'un
   * fichier occupe déjà la place : l'appelant doit le signaler plutôt que de
   * laisser croire à un succès. Le retrait, lui, est idempotent.
   */
  async setCouverture(
    {
      collectiviteId,
      demarcheId,
      documentId,
      couvert,
      modifiedBy,
    }: {
      collectiviteId: number;
      demarcheId: number;
      documentId: string;
      couvert: boolean;
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;

    if (!couvert) {
      await db
        .delete(demarcheDocumentTable)
        .where(
          and(
            eq(demarcheDocumentTable.demarcheId, demarcheId),
            eq(demarcheDocumentTable.documentId, documentId),
            isNull(demarcheDocumentTable.fichierId)
          )
        );
      return true;
    }

    // `setWhere` distingue les deux conflits possibles sur (démarche, pièce) :
    // une couverture déjà déclarée est simplement rafraîchie (l'appel reste
    // idempotent), tandis qu'un fichier déposé bloque l'écriture — rien n'est
    // renvoyé, et l'appelant sait que la place est prise.
    const written = await db
      .insert(demarcheDocumentTable)
      .values({
        collectiviteId,
        demarcheId,
        documentId,
        modifiedBy,
        modifiedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [
          demarcheDocumentTable.demarcheId,
          demarcheDocumentTable.documentId,
        ],
        set: buildConflictUpdateColumns(demarcheDocumentTable, [
          'modifiedBy',
          'modifiedAt',
        ]),
        setWhere: isNull(demarcheDocumentTable.fichierId),
      })
      .returning({ id: demarcheDocumentTable.id });

    return written.length > 0;
  }
}
