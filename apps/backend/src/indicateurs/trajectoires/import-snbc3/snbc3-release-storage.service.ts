import { Injectable, Logger } from '@nestjs/common';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { ImportTrajectoireSnbc3Error } from './import-trajectoire-snbc3.errors';
import { Snbc3LastImport } from './import-trajectoire-snbc3.input';
import { Snbc3Release } from './snbc3-artifact.reader';

/**
 * Bucket privé de la release importée : le classeur standalone, servi par
 * l'export (lot 5), son manifeste et le suivi du dernier import. Créé par
 * l'import s'il n'existe pas : seul le service role y accède. Chemins fixes :
 * chaque import complet écrase les fichiers du précédent.
 */
export const SNBC3_BUCKET = 'trajectoires-snbc3';
export const SNBC3_WORKBOOK_PATH = 'standalone.xlsx';
/**
 * `manifest.json` de la release importée, copié tel quel. Ses métadonnées
 * d'objet (`commit`, `version`) désignent la release en base.
 */
export const SNBC3_MANIFEST_PATH = 'manifest.json';
/** Statut et rapport du dernier import (`Snbc3LastImport`). */
export const SNBC3_LAST_IMPORT_PATH = 'last-import.json';
const JSON_MIME_TYPE = 'application/json';
const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const importedReleaseSchema = z.object({
  commit: z.string(),
  version: z.string(),
});

export type Snbc3ImportedRelease = z.infer<typeof importedReleaseSchema>;

/** Ce que le bucket garde d'une release : ni le parquet, ni le PDF. */
export type Snbc3ReleaseFiles = Pick<
  Snbc3Release,
  'sha' | 'version' | 'manifest' | 'workbook'
>;

/** Fichiers de la release importée et suivi de l'import, dans le bucket. */
@Injectable()
export class Snbc3ReleaseStorageService {
  private readonly logger = new Logger(Snbc3ReleaseStorageService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly databaseService: DatabaseService
  ) {}

  /** Classeur standalone et manifeste de la release, à côté l'un de l'autre. */
  async storeReleaseFiles(
    release: Snbc3ReleaseFiles
  ): Promise<Result<void, ImportTrajectoireSnbc3Error>> {
    const bucket = await this.supabaseService.ensurePrivateBucket(SNBC3_BUCKET);
    if (!bucket.success) return failure('SNBC3_WORKBOOK_STORAGE_ERROR');

    const metadata = { commit: release.sha, version: release.version };
    for (const file of [
      {
        path: SNBC3_WORKBOOK_PATH,
        content: release.workbook.content,
        mimeType: XLSX_MIME_TYPE,
        metadata: { ...metadata, name: release.workbook.name },
      },
      // En dernier : le manifeste désigne la release importée, une fois le
      // classeur en place.
      {
        path: SNBC3_MANIFEST_PATH,
        content: release.manifest,
        mimeType: JSON_MIME_TYPE,
        metadata,
      },
    ]) {
      const saved = await this.supabaseService.saveInStorage({
        bucket: SNBC3_BUCKET,
        path: file.path,
        file: Buffer.from(file.content),
        mimeType: file.mimeType,
        metadata: file.metadata,
      });
      if (!saved.success) return failure('SNBC3_WORKBOOK_STORAGE_ERROR');
    }
    return success(undefined);
  }

  /**
   * Release du dernier import complet, lue dans les métadonnées de
   * `manifest.json` ; `null` avant le premier.
   */
  async getImportedRelease(): Promise<Snbc3ImportedRelease | null> {
    const [object] = await this.databaseService.db
      .select({ userMetadata: storageObjectTable.userMetadata })
      .from(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, SNBC3_BUCKET),
          eq(storageObjectTable.name, SNBC3_MANIFEST_PATH)
        )
      );
    const parsed = importedReleaseSchema.safeParse(object?.userMetadata);
    return parsed.success ? parsed.data : null;
  }

  /**
   * Suivi de l'import, lisible sans les logs : l'import tourne dans un job.
   * Un échec d'écriture n'interrompt pas l'import.
   */
  async writeLastImport(lastImport: Snbc3LastImport) {
    const bucket = await this.supabaseService.ensurePrivateBucket(SNBC3_BUCKET);
    const saved = bucket.success
      ? await this.supabaseService.saveInStorage({
          bucket: SNBC3_BUCKET,
          path: SNBC3_LAST_IMPORT_PATH,
          file: JSON.stringify(
            lastImport.status === 'running'
              ? lastImport
              : { ...lastImport, finishedAt: new Date().toISOString() },
            null,
            2
          ),
          mimeType: JSON_MIME_TYPE,
        })
      : bucket;
    if (!saved.success) {
      this.logger.warn(
        `Statut de l'import SNBC 3 non enregistré (${lastImport.status})`
      );
    }
  }
}
