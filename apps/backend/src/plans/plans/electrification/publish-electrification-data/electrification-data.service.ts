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
import { z } from 'zod';
import { electrificationStorageConfig } from '../config/electrification-storage.config';
import { ElectrificationDataVersion } from './electrification-data-version.rules';
import { ElectrificationDataError } from './electrification-data.errors';
import { ElectrificationDataKind } from './publish-electrification-data.input';

const activeVersionSchema = z.object({ version: z.string().min(1) });
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
    context: ElectrificationPublicationContext
  ) {
    return this.write(kind, data, context, 'sync');
  }

  private async write(
    kind: ElectrificationDataKind,
    data: PublishedData,
    context: ElectrificationPublicationContext,
    mode: 'exact' | 'sync'
  ): Promise<
    Result<{ version: string; changed: boolean }, ElectrificationDataError>
  > {
    try {
      const bucket = await this.storage.ensurePrivateBucket(
        electrificationStorageConfig.bucket
      );
      if (!bucket.success) return failure('STORAGE_ERROR');
      return await this.database.db.transaction(async (tx) => {
        // Même verrou pour les publications administratives et CI, activation comprise.
        const lockKey = `${electrificationStorageConfig.bucket}:${kind}`;
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`
        );
        if (mode === 'sync') {
          const active = await this.read(
            kind,
            this.schema(kind),
            undefined,
            tx
          );
          if (!active.success && active.error !== 'DATA_UNAVAILABLE')
            return active;
          if (
            active.success &&
            ElectrificationDataVersion.identify(active.data) === data.version
          ) {
            return success({ version: active.data.version, changed: false });
          }
        }
        const metadata = {
          version: data.version,
          ...context,
          publishedAt: new Date().toISOString(),
        };
        const candidate =
          mode === 'sync' && 'laureats' in data
            ? { ...data, validFrom: metadata.publishedAt }
            : data;
        const stored = await this.storeVersion(
          kind,
          candidate,
          metadata,
          tx,
          mode
        );
        if (!stored.success) return stored;
        // L'objet immuable précède son activation. Sa première date reste inchangée lors d'un retry.
        // Le runtime lit la sélection dans les métadonnées en base, sans cache du manifeste JSON.
        const activated = await this.storage.saveInStorage({
          bucket: electrificationStorageConfig.bucket,
          path: `${kind}/${electrificationStorageConfig.activeVersionFile}`,
          file: JSON.stringify({ version: data.version }),
          mimeType: electrificationStorageConfig.mimeType,
          metadata,
        });
        return activated.success
          ? success({ version: data.version, changed: true })
          : failure('STORAGE_ERROR');
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
    version?: string,
    tx?: Transaction
  ): Promise<Result<T, ElectrificationDataError>> {
    try {
      const readingActiveVersion = version === undefined;
      if (version === undefined) {
        // Comme pour SNBC3, les métadonnées en base évitent un manifeste actif mis en cache.
        const active = await this.getObject(
          `${kind}/${electrificationStorageConfig.activeVersionFile}`,
          tx
        );
        if (!active) return failure('DATA_UNAVAILABLE');
        const parsed = activeVersionSchema.safeParse(active.userMetadata);
        if (!parsed.success) return failure('INVALID_DATA');
        version = parsed.data.version;
      }
      const content = await this.readVersion(kind, version, tx);
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
    tx: Transaction,
    mode: 'exact' | 'sync'
  ): Promise<Result<void, ElectrificationDataError>> {
    const path = this.versionPath(kind, data.version);
    if (!(await this.getObject(path, tx))) {
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
    const existing = await this.read(kind, this.schema(kind), data.version, tx);
    if (!existing.success) return failure('STORAGE_ERROR');
    const matches =
      mode === 'sync'
        ? ElectrificationDataVersion.identify(existing.data) === data.version
        : isDeepStrictEqual(existing.data, data);
    return matches ? success(undefined) : failure('VERSION_ALREADY_EXISTS');
  }

  private async readVersion(
    kind: ElectrificationDataKind,
    version: string,
    tx?: Transaction
  ): Promise<Result<unknown, ElectrificationDataError>> {
    const path = this.versionPath(kind, version);
    if (!(await this.getObject(path, tx))) return failure('DATA_UNAVAILABLE');
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

  private async getObject(path: string, tx?: Transaction) {
    const [object] = await (tx ?? this.database.db)
      .select({ userMetadata: storageObjectTable.userMetadata })
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
