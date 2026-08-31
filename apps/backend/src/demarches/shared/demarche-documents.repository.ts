import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import {
  DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  isDemarcheDossierDocumentsComplet,
} from '@tet/domain/demarches';
import type {
  DemarcheType,
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
  DemarcheDocumentFichier,
  DemarcheDocumentAdditional,
  DemarcheDocumentsConfig,
  DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import { demarcheDefinitionTable } from './models/demarche-definition.table';
import { DemarcheDocumentApplicabiliteService } from './demarche-document-applicabilite.service';
import { demarcheDocumentDefinitionTable } from './models/demarche-document-definition.table';
import { demarcheDocumentAdditionalTable } from './models/demarche-document-additional.table';
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

/** Ce que le stockage sait d'un fichier de la bibliothèque. */
const fichierSelection = {
  filename: bibliothequeFichierTable.filename,
  hash: bibliothequeFichierTable.hash,
  bucketId: collectiviteBucketTable.bucketId,
  filesize: sql<
    number | null
  >`(${storageObjectTable.metadata} ->> 'size')::int`,
  mimeType: sql<string | null>`${storageObjectTable.metadata} ->> 'mimetype'`,
};

/**
 * Jointures menant d'un `fichier_id` à son objet de stockage. Externes de bout
 * en bout : une ligne sans fichier (couverture déclarée, pièce additionnelle en
 * attente de dépôt) reste dans le résultat, et un fichier inséré hors stockage
 * reste trouvable, avec un type inconnu.
 */
const withFichierJoins = <Query extends PgSelect>(
  query: Query,
  fichierId: PgColumn
) =>
  query
    .leftJoin(
      bibliothequeFichierTable,
      eq(fichierId, bibliothequeFichierTable.id)
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
    );

/** Le fichier d'une ligne, ou `null` quand rien n'est déposé. */
const toFichier = (row: {
  fichierId: number | null;
  filename: string | null;
  hash: string | null;
  bucketId: string | null;
  filesize: number | null;
}): DemarcheDocumentFichier | null =>
  row.fichierId !== null
    ? {
        id: row.fichierId,
        filename: row.filename ?? '',
        hash: row.hash ?? '',
        bucketId: row.bucketId ?? null,
        filesize: row.filesize ?? null,
      }
    : null;

/**
 * Le catalogue tel qu'il est en base : la condition d'assujettissement n'existe
 * qu'ici, elle ne franchit jamais la frontière du serveur.
 */
type DemarcheDocumentDefinitionWithExpr = DemarcheDocumentDefinition & {
  exprApplicable: string | null;
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

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly applicabiliteService: DemarcheDocumentApplicabiliteService
  ) {}

  /**
   * Catalogue des pièces attendues d'une collectivité pour un type de démarche,
   * substitutions agrégées, trié par ordre d'affichage.
   *
   * Les pièces que le catalogue réserve à d'autres territoires en sont retirées
   * ici, et nulle part ailleurs : c'est le seul point de passage du catalogue,
   * donc la seule façon de garantir que l'écran de la collectivité et le guard
   * de transmission voient le même dossier.
   */
  async listDefinitions(
    demarcheType: DemarcheType,
    {
      collectiviteId,
      demarcheId,
    }: { collectiviteId: number; demarcheId: number },
    tx?: Transaction
  ): Promise<DemarcheDocumentDefinition[]> {
    const definitions = await this.listDefinitionsInCatalogue(demarcheType, tx);

    const expressions = definitions
      .map(({ exprApplicable }) => exprApplicable)
      .filter((expression): expression is string => expression !== null);
    // Aucune pièce conditionnelle : rien à charger, la lecture ne coûte rien de
    // plus qu'avant.
    const context =
      expressions.length === 0
        ? null
        : await this.applicabiliteService.loadContext(
            { collectiviteId, demarcheId, demarcheType },
            expressions,
            tx
          );

    return definitions
      .filter(({ exprApplicable }) =>
        this.applicabiliteService.isApplicable(exprApplicable, context)
      )
      .map(({ exprApplicable: _exprApplicable, ...definition }) => definition);
  }

  /**
   * Le catalogue brut, toutes collectivités confondues, condition
   * d'assujettissement comprise. Réservé aux appelants qui doivent voir une
   * pièce même quand elle ne concerne plus la collectivité — retirer un dépôt
   * devenu orphelin, par exemple.
   */
  async listDefinitionsInCatalogue(
    demarcheType: DemarcheType,
    tx?: Transaction
  ): Promise<DemarcheDocumentDefinitionWithExpr[]> {
    const db = tx ?? this.databaseService.db;

    const [definitions, substitutions] = await Promise.all([
      db
        .select({
          id: demarcheDocumentDefinitionTable.id,
          nom: demarcheDocumentDefinitionTable.nom,
          description: demarcheDocumentDefinitionTable.description,
          requis: demarcheDocumentDefinitionTable.requis,
          ordre: demarcheDocumentDefinitionTable.ordre,
          etape: demarcheDocumentDefinitionTable.etape,
          exprApplicable: demarcheDocumentDefinitionTable.exprApplicable,
        })
        .from(demarcheDocumentDefinitionTable)
        .where(eq(demarcheDocumentDefinitionTable.demarcheType, demarcheType))
        .orderBy(asc(demarcheDocumentDefinitionTable.ordre)),
      db
        .select({
          documentId: demarcheDocumentSubstitutionTable.documentId,
          substitutId: demarcheDocumentSubstitutionTable.substitutId,
          automatic: demarcheDocumentSubstitutionTable.automatic,
        })
        .from(demarcheDocumentSubstitutionTable),
    ]);

    // Deux listes distinctes : ce qui couvre d'office, et ce que la collectivité
    // peut déclarer. Le domaine ne les traite pas de la même façon.
    const substitutsByDocumentId = new Map<string, string[]>();
    const substitutsDeclarablesByDocumentId = new Map<string, string[]>();
    for (const { documentId, substitutId, automatic } of substitutions) {
      const index = automatic
        ? substitutsByDocumentId
        : substitutsDeclarablesByDocumentId;
      const substituts = index.get(documentId) ?? [];
      substituts.push(substitutId);
      index.set(documentId, substituts);
    }

    return definitions.map((definition) => ({
      ...definition,
      substituts: substitutsByDocumentId.get(definition.id) ?? [],
      substitutsDeclarables:
        substitutsDeclarablesByDocumentId.get(definition.id) ?? [],
    }));
  }

  async findDefinition(
    demarcheType: DemarcheType,
    documentId: string,
    cible: { collectiviteId: number; demarcheId: number },
    tx?: Transaction
  ): Promise<DemarcheDocumentDefinition | undefined> {
    const definitions = await this.listDefinitions(demarcheType, cible, tx);
    return definitions.find((definition) => definition.id === documentId);
  }

  /**
   * Même recherche, sur le catalogue brut : une pièce qui ne concerne plus la
   * collectivité doit rester retirable, sinon son dépôt serait indéboulonnable.
   */
  async findDefinitionInCatalogue(
    demarcheType: DemarcheType,
    documentId: string,
    tx?: Transaction
  ): Promise<DemarcheDocumentDefinition | undefined> {
    const definitions = await this.listDefinitionsInCatalogue(demarcheType, tx);
    const found = definitions.find(
      (definition) => definition.id === documentId
    );
    if (!found) {
      return undefined;
    }
    const { exprApplicable: _exprApplicable, ...definition } = found;
    return definition;
  }

  /**
   * Ce que le type de démarche autorise. Un type sans ligne de configuration
   * n'ouvre rien de plus que le catalogue : le repli est délibérément fermé sur
   * le dépôt de pièces additionnelles.
   */
  async loadDocumentsConfig(
    demarcheType: DemarcheType,
    tx?: Transaction
  ): Promise<DemarcheDocumentsConfig> {
    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        additionalAmont: demarcheDefinitionTable.documentsAdditionalAmont,
        additionalAval: demarcheDefinitionTable.documentsAdditionalAval,
        formatsAutorises: demarcheDefinitionTable.documentsFormatsAutorises,
        mimeTypesAutorises: demarcheDefinitionTable.documentsMimeTypesAutorises,
      })
      .from(demarcheDefinitionTable)
      .where(eq(demarcheDefinitionTable.demarcheType, demarcheType))
      .limit(1);

    const row = rows[0];
    if (!row) {
      this.logger.warn(
        `No demarche_definition row for type ${demarcheType}, falling back to the closed default configuration`
      );
      return DEMARCHE_DOCUMENTS_CONFIG_DEFAULT;
    }
    return {
      additionalAmont: row.additionalAmont,
      additionalAval: row.additionalAval,
      formatsAutorises: row.formatsAutorises ?? null,
      mimeTypesAutorises: row.mimeTypesAutorises ?? null,
    };
  }

  /**
   * Ce que le type autorise, le catalogue attendu, les pièces satisfaites et
   * les pièces additionnelles.
   */
  async loadSnapshot(
    {
      demarcheId,
      demarcheType,
      collectiviteId,
    }: {
      demarcheId: number;
      demarcheType: DemarcheType;
      /** Celle de la démarche, jamais celle de l'appelant : un instructeur doit
       * voir le dossier tel qu'il est attendu de la collectivité déposante. */
      collectiviteId: number;
    },
    tx?: Transaction
  ): Promise<DemarcheDocumentsSnapshot> {
    const [config, definitions, documents, documentsAdditional] =
      await Promise.all([
        this.loadDocumentsConfig(demarcheType, tx),
        this.listDefinitions(demarcheType, { collectiviteId, demarcheId }, tx),
        this.listDocuments(demarcheId, tx),
        this.listDocumentsAdditional(demarcheId, tx),
      ]);

    return { config, definitions, documents, documentsAdditional };
  }

  /**
   * Dossier prêt au dépôt : toutes les pièces requises sont satisfaites. La
   * règle est la fonction pure du domaine, appliquée au même snapshot que celui
   * servi au front — les deux ne peuvent pas diverger.
   */
  async isDocumentsComplet(
    demarche: { id: number; type: DemarcheType; collectiviteId: number },
    tx?: Transaction
  ): Promise<boolean> {
    const snapshot = await this.loadSnapshot(
      {
        demarcheId: demarche.id,
        demarcheType: demarche.type,
        collectiviteId: demarche.collectiviteId,
      },
      tx
    );
    return isDemarcheDossierDocumentsComplet(snapshot);
  }

  async listDocuments(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentDepose[]> {
    const db = tx ?? this.databaseService.db;

    const rows = await withFichierJoins(
      db
        .select({
          id: demarcheDocumentTable.id,
          documentId: demarcheDocumentTable.documentId,
          etape: demarcheDocumentTable.etape,
          commentaire: demarcheDocumentTable.commentaire,
          modifiedAt: sqlToDateTimeISO(demarcheDocumentTable.modifiedAt),
          modifiedBy: demarcheDocumentTable.modifiedBy,
          fichierId: demarcheDocumentTable.fichierId,
          ...fichierSelection,
        })
        .from(demarcheDocumentTable)
        .$dynamic(),
      demarcheDocumentTable.fichierId
    ).where(eq(demarcheDocumentTable.demarcheId, demarcheId));

    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      etape: row.etape,
      commentaire: row.commentaire ?? '',
      modifiedAt: row.modifiedAt,
      modifiedBy: row.modifiedBy ?? null,
      fichier: toFichier(row),
    }));
  }

  /**
   * Pièces additionnelles, dans leur ordre d'ajout : le catalogue leur donne
   * un ordre, elles n'en ont pas d'autre que celui-là.
   */
  async listDocumentsAdditional(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentAdditional[]> {
    const db = tx ?? this.databaseService.db;

    const rows = await withFichierJoins(
      db
        .select({
          id: demarcheDocumentAdditionalTable.id,
          etape: demarcheDocumentAdditionalTable.etape,
          titre: demarcheDocumentAdditionalTable.titre,
          commentaire: demarcheDocumentAdditionalTable.commentaire,
          modifiedAt: sqlToDateTimeISO(
            demarcheDocumentAdditionalTable.modifiedAt
          ),
          modifiedBy: demarcheDocumentAdditionalTable.modifiedBy,
          fichierId: demarcheDocumentAdditionalTable.fichierId,
          ...fichierSelection,
        })
        .from(demarcheDocumentAdditionalTable)
        .$dynamic(),
      demarcheDocumentAdditionalTable.fichierId
    )
      .where(eq(demarcheDocumentAdditionalTable.demarcheId, demarcheId))
      .orderBy(asc(demarcheDocumentAdditionalTable.id));

    return rows.map((row) => ({
      id: row.id,
      etape: row.etape,
      titre: row.titre ?? '',
      commentaire: row.commentaire ?? '',
      modifiedAt: row.modifiedAt,
      modifiedBy: row.modifiedBy ?? null,
      fichier: toFichier(row),
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
        ...fichierSelection,
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

  /**
   * Dépose ou remplace la pièce : une seule version par (démarche, pièce,
   * temps). Redéposer à l'aval une pièce déjà là à l'amont crée donc une
   * seconde version, sans toucher à la première.
   */
  async upsertDocument(
    values: {
      collectiviteId: number;
      demarcheId: number;
      documentId: string;
      etape: DemarcheDocumentEtape;
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
          demarcheDocumentTable.etape,
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

  /** Retire une version précise : l'autre temps garde la sienne. */
  async deleteDocument(
    {
      demarcheId,
      documentId,
      etape,
    }: {
      demarcheId: number;
      documentId: string;
      etape: DemarcheDocumentEtape;
    },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;

    const deleted = await db
      .delete(demarcheDocumentTable)
      .where(
        and(
          eq(demarcheDocumentTable.demarcheId, demarcheId),
          eq(demarcheDocumentTable.documentId, documentId),
          eq(demarcheDocumentTable.etape, etape)
        )
      )
      .returning({ id: demarcheDocumentTable.id });

    return deleted.length > 0;
  }

  /**
   * Déclare (ou retire) qu'une pièce est comprise dans une autre : une ligne
   * sans fichier ni lien. Elle occupe la même place qu'un dépôt — les deux modes
   * de satisfaction d'une pièce sont exclusifs.
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
            eq(demarcheDocumentTable.etape, 'amont'),
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
        // Déclarer une inclusion parle du dossier transmis : la reprise aval est
        // un dépôt de fichier, jamais une substitution.
        etape: 'amont',
        modifiedBy,
        modifiedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [
          demarcheDocumentTable.demarcheId,
          demarcheDocumentTable.documentId,
          demarcheDocumentTable.etape,
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

  /**
   * Coche par défaut les inclusions que le catalogue rattache à `substitutId`,
   * au moment où ce document est déposé. Rien n'est écrasé : une pièce qui a
   * déjà son propre dépôt garde sa ligne, et une case décochée puis recochée
   * reste telle quelle jusqu'au prochain dépôt du document.
   *
   * Matérialiser ces déclarations plutôt que les déduire est ce qui rend la case
   * décochable : l'état affiché est celui qu'on lit, pas une règle recalculée.
   */
  async declareDefaultInclusions(
    {
      collectiviteId,
      demarcheId,
      documentIds,
      modifiedBy,
    }: {
      collectiviteId: number;
      demarcheId: number;
      documentIds: readonly string[];
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<void> {
    if (documentIds.length === 0) {
      return;
    }
    const db = tx ?? this.databaseService.db;

    await db
      .insert(demarcheDocumentTable)
      .values(
        documentIds.map((documentId) => ({
          collectiviteId,
          demarcheId,
          documentId,
          // Une inclusion ne se déclare que sur le dossier transmis.
          etape: 'amont' as const,
          modifiedBy,
          modifiedAt: new Date().toISOString(),
        }))
      )
      .onConflictDoNothing({
        target: [
          demarcheDocumentTable.demarcheId,
          demarcheDocumentTable.documentId,
          demarcheDocumentTable.etape,
        ],
      });
  }

  /**
   * Retire les déclarations d'inclusion devenues sans objet : plus aucune des
   * pièces qui pouvaient les accueillir n'est déposée. Appelé après le retrait
   * d'un document — sans quoi une case resterait cochée derrière un document qui
   * n'existe plus, et se rallumerait toute seule au prochain dépôt.
   */
  async pruneInertInclusions(
    demarcheId: number,
    tx?: Transaction
  ): Promise<string[]> {
    const db = tx ?? this.databaseService.db;

    const pruned = await db
      .delete(demarcheDocumentTable)
      .where(
        and(
          eq(demarcheDocumentTable.demarcheId, demarcheId),
          isNull(demarcheDocumentTable.fichierId),
          sql`not exists (
            select 1
            from ${demarcheDocumentSubstitutionTable} as substitution
            join ${demarcheDocumentTable} as substitut
              on substitut.document_id = substitution.substitut_id
             and substitut.demarche_id = ${demarcheDocumentTable.demarcheId}
             and substitut.etape = 'amont'
             and substitut.fichier_id is not null
            where substitution.document_id = ${demarcheDocumentTable.documentId}
          )`
        )
      )
      .returning({ documentId: demarcheDocumentTable.documentId });

    return pruned.map(({ documentId }) => documentId);
  }

  /**
   * Pièce additionnelle de cette démarche. Le rattachement fait partie du critère de
   * recherche : l'identifiant d'une pièce d'une autre démarche est simplement
   * introuvable, sans révéler son existence.
   */
  async findDocumentAdditional(
    {
      demarcheId,
      documentAdditionalId,
    }: { demarcheId: number; documentAdditionalId: number },
    tx?: Transaction
  ): Promise<{ id: number; etape: DemarcheDocumentEtape } | undefined> {
    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        id: demarcheDocumentAdditionalTable.id,
        etape: demarcheDocumentAdditionalTable.etape,
      })
      .from(demarcheDocumentAdditionalTable)
      .where(
        and(
          eq(demarcheDocumentAdditionalTable.id, documentAdditionalId),
          eq(demarcheDocumentAdditionalTable.demarcheId, demarcheId)
        )
      )
      .limit(1);

    return rows[0];
  }

  /**
   * Ouvre une pièce additionnelle. Le titre n'est pas passé : il prend sa valeur par
   * défaut (vide, comme partout dans la famille `preuve_base`) et se renseigne
   * plus tard, comme le fichier.
   */
  async insertDocumentAdditional(
    values: {
      collectiviteId: number;
      demarcheId: number;
      etape: DemarcheDocumentEtape;
      commentaire: string;
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<DemarcheDocumentAdditional | undefined> {
    const db = tx ?? this.databaseService.db;

    const inserted = await db
      .insert(demarcheDocumentAdditionalTable)
      .values({ ...values, modifiedAt: new Date().toISOString() })
      .returning({ id: demarcheDocumentAdditionalTable.id });

    if (inserted.length === 0) {
      return undefined;
    }
    return this.findDocumentAdditionalDepose(
      { demarcheId: values.demarcheId, documentAdditionalId: inserted[0].id },
      tx
    );
  }

  /**
   * Nomme une pièce additionnelle et/ou y dépose un fichier. Le rattachement est
   * dans le WHERE et jamais dans le SET : une pièce ne peut pas changer de démarche ni
   * de collectivité par le payload.
   */
  async updateDocumentAdditional(
    {
      demarcheId,
      documentAdditionalId,
      titre,
      fichierId,
      modifiedBy,
    }: {
      demarcheId: number;
      documentAdditionalId: number;
      titre?: string;
      fichierId?: number;
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<DemarcheDocumentAdditional | undefined> {
    const db = tx ?? this.databaseService.db;

    const updated = await db
      .update(demarcheDocumentAdditionalTable)
      .set({
        ...(titre !== undefined ? { titre } : {}),
        ...(fichierId !== undefined ? { fichierId } : {}),
        modifiedBy,
        modifiedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(demarcheDocumentAdditionalTable.id, documentAdditionalId),
          eq(demarcheDocumentAdditionalTable.demarcheId, demarcheId)
        )
      )
      .returning({ id: demarcheDocumentAdditionalTable.id });

    if (updated.length === 0) {
      return undefined;
    }
    return this.findDocumentAdditionalDepose(
      { demarcheId, documentAdditionalId },
      tx
    );
  }

  async deleteDocumentAdditional(
    {
      demarcheId,
      documentAdditionalId,
    }: { demarcheId: number; documentAdditionalId: number },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;

    const deleted = await db
      .delete(demarcheDocumentAdditionalTable)
      .where(
        and(
          eq(demarcheDocumentAdditionalTable.id, documentAdditionalId),
          eq(demarcheDocumentAdditionalTable.demarcheId, demarcheId)
        )
      )
      .returning({ id: demarcheDocumentAdditionalTable.id });

    return deleted.length > 0;
  }

  /** Pièce additionnelle telle que la voit le front, fichier résolu. */
  private async findDocumentAdditionalDepose(
    {
      demarcheId,
      documentAdditionalId,
    }: { demarcheId: number; documentAdditionalId: number },
    tx?: Transaction
  ): Promise<DemarcheDocumentAdditional | undefined> {
    const documentsAdditional = await this.listDocumentsAdditional(
      demarcheId,
      tx
    );
    return documentsAdditional.find(({ id }) => id === documentAdditionalId);
  }
}
