import { Injectable, Logger } from '@nestjs/common';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  electrificationConfigSchema,
  ElectrificationLaureatsConfig,
  electrificationLaureatsConfigSchema,
} from '@tet/domain/plans';
import { and, eq, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { electrificationStorageConfig } from '../config/electrification-storage.config';
import { electrificationDataSelectionTable as selectionTable } from './electrification-data-selection.table';
import { ElectrificationDataVersion } from './electrification-data-version.rules';
import { ElectrificationDataError } from './electrification-data.errors';
import { ElectrificationDataKind } from './publish-electrification-data.input';

export type ElectrificationPublicationContext = {
  publishedBy: string;
  sourceRevision?: string;
  workflowRun?: string;
};

type PublishedData = ElectrificationConfig | ElectrificationLaureatsConfig;
type DataSchema<T> = {
  safeParse: (
    input: unknown
  ) => { success: true; data: T } | { success: false };
};

/** Données publiées localement : aucune lecture de la source métier pendant un import. */
@Injectable()
export class ElectrificationDataService {
  private readonly logger = new Logger(ElectrificationDataService.name);

  constructor(
    private readonly storage: SupabaseService,
    private readonly database: DatabaseService
  ) {}

  getCatalogue(version?: string) {
    return this.read('catalogue', electrificationConfigSchema, version);
  }

  /** Révision observée avant de préparer une publication depuis la source. */
  async getSelection(kind: ElectrificationDataKind) {
    try {
      return success((await this.readSelection(kind)) ?? null);
    } catch (error) {
      this.logger.error('Lecture de la sélection active impossible', error);
      return failure('STORAGE_ERROR' as const);
    }
  }

  getLaureats(version?: string) {
    return this.read('laureats', electrificationLaureatsConfigSchema, version);
  }

  /** Publication exacte d'un fichier validé, notamment pour restaurer une version. */
  publish(
    kind: ElectrificationDataKind,
    data: PublishedData,
    context: ElectrificationPublicationContext
  ): Promise<Result<{ version: string }, ElectrificationDataError>> {
    return this.write(kind, data, context, 'exact');
  }

  /** Contenu validé de Grist : date de première publication et relance sans écriture. */
  publishFromSource(
    kind: ElectrificationDataKind,
    data: PublishedData,
    baseRevision: string | null | undefined,
    context: ElectrificationPublicationContext
  ) {
    return this.write(kind, data, context, 'sync', baseRevision);
  }

  private async write(
    kind: ElectrificationDataKind,
    data: PublishedData,
    context: ElectrificationPublicationContext,
    mode: 'exact' | 'sync',
    baseRevision?: string | null
  ): Promise<
    Result<{ version: string; changed: boolean }, ElectrificationDataError>
  > {
    try {
      const bucket = await this.storage.ensurePrivateBucket(
        electrificationStorageConfig.bucket
      );
      if (!bucket.success) return failure('STORAGE_ERROR');
      const observed = await this.readSelection(kind);
      const active =
        mode === 'sync' && observed
          ? await this.read(kind, this.schema(kind), observed.version)
          : null;
      if (active && !active.success)
        return active.error === 'DATA_UNAVAILABLE'
          ? failure('INVALID_DATA')
          : active;
      const unchanged =
        active?.success &&
        ElectrificationDataVersion.identify(active.data) === data.version;
      if (
        !unchanged &&
        baseRevision !== undefined &&
        (observed?.revision ?? null) !== baseRevision
      )
        return failure('PUBLICATION_CONFLICT');
      const version = unchanged ? active.data.version : data.version;
      const metadata = {
        version,
        ...context,
        publishedAt: new Date().toISOString(),
      };
      if (!unchanged) {
        const candidate =
          mode === 'sync' && 'laureats' in data
            ? { ...data, validFrom: metadata.publishedAt }
            : data;
        const stored = await this.storeVersion(kind, candidate, metadata, mode);
        if (!stored.success) return stored;
      }
      // Aucun appel HTTP sous verrou : un upload tardif ne peut activer sa version.
      return await this.database.db.transaction(async (tx) => {
        const lockKey = `${electrificationStorageConfig.bucket}:${kind}`;
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`
        );
        const current = await this.readSelection(kind, tx);
        if (current?.version === version)
          return success({ version, changed: false });
        if ((current?.revision ?? null) !== (observed?.revision ?? null))
          return failure('PUBLICATION_CONFLICT');
        await tx
          .insert(selectionTable)
          .values({ kind, version, metadata })
          .onConflictDoUpdate({
            target: selectionTable.kind,
            set: { version, metadata, revision: sql`gen_random_uuid()` },
          });
        return success({ version, changed: true });
      });
    } catch (error) {
      this.logger.error(
        'Publication des données Électrification impossible',
        error
      );
      return failure('STORAGE_ERROR');
    }
  }

  private schema(kind: ElectrificationDataKind): DataSchema<PublishedData> {
    return kind === 'catalogue'
      ? electrificationConfigSchema
      : electrificationLaureatsConfigSchema;
  }

  private async read<T extends PublishedData>(
    kind: ElectrificationDataKind,
    schema: DataSchema<T>,
    version?: string
  ): Promise<Result<T, ElectrificationDataError>> {
    try {
      const readingActiveVersion = version === undefined;
      if (version === undefined) {
        const active = await this.readSelection(kind);
        if (!active) return failure('DATA_UNAVAILABLE');
        version = active.version;
      }
      const content = await this.readVersion(kind, version);
      // Une sélection existante dont le contenu a disparu est corrompue,
      // pas un environnement vierge à initialiser depuis les données livrées.
      if (
        !content.success &&
        content.error === 'DATA_UNAVAILABLE' &&
        readingActiveVersion
      ) {
        return failure('INVALID_DATA');
      }
      if (!content.success) return content;
      const parsed = schema.safeParse(content.data);
      return parsed.success && parsed.data.version === version
        ? success(parsed.data)
        : failure('INVALID_DATA');
    } catch (error) {
      this.logger.error(
        'Lecture des données Électrification impossible',
        error
      );
      return failure('STORAGE_ERROR');
    }
  }

  private async storeVersion(
    kind: ElectrificationDataKind,
    data: PublishedData,
    metadata: Record<string, string>,
    mode: 'exact' | 'sync'
  ): Promise<Result<void, ElectrificationDataError>> {
    const path = this.versionPath(kind, data.version);
    if (!(await this.getObject(path))) {
      const stored = await this.storage.saveInStorage({
        bucket: electrificationStorageConfig.bucket,
        path,
        file: JSON.stringify(data),
        mimeType: electrificationStorageConfig.mimeType,
        metadata,
        upsert: false,
      });
      if (stored.success) return success(undefined);
      // Un échec d'upload ne prouve pas l'absence de l'objet : vérifier son contenu.
    }
    const existing = await this.read(kind, this.schema(kind), data.version);
    if (!existing.success) return failure('STORAGE_ERROR');
    const matches =
      mode === 'sync'
        ? ElectrificationDataVersion.identify(existing.data) === data.version
        : isDeepStrictEqual(existing.data, data);
    return matches ? success(undefined) : failure('VERSION_ALREADY_EXISTS');
  }

  private async readVersion(
    kind: ElectrificationDataKind,
    version: string
  ): Promise<Result<unknown, ElectrificationDataError>> {
    const path = this.versionPath(kind, version);
    if (!(await this.getObject(path))) return failure('DATA_UNAVAILABLE');
    const { data, error } = await this.storage.client.storage
      .from(electrificationStorageConfig.bucket)
      .download(path);
    if (error || !data) return failure('STORAGE_ERROR');
    try {
      return success(JSON.parse(await data.text()));
    } catch {
      return failure('INVALID_DATA');
    }
  }

  private async readSelection(kind: ElectrificationDataKind, tx?: Transaction) {
    const [selection] = await (tx ?? this.database.db)
      .select()
      .from(selectionTable)
      .where(eq(selectionTable.kind, kind));
    return selection;
  }

  private async getObject(path: string) {
    const [object] = await this.database.db
      .select({ name: storageObjectTable.name })
      .from(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, electrificationStorageConfig.bucket),
          eq(storageObjectTable.name, path)
        )
      );
    return object;
  }

  private versionPath(kind: ElectrificationDataKind, version: string) {
    // La version métier ne devient jamais un chemin fourni par l'appelant.
    const key = createHash('sha256').update(version).digest('hex');
    return `${kind}/${electrificationStorageConfig.versionsDirectory}/${key}.json`;
  }
}
