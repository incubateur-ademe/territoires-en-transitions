import { Injectable, Logger } from '@nestjs/common';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { Readable } from 'node:stream';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { ImportTrajectoireSnbc3Error } from './import-trajectoire-snbc3.errors';
import { Snbc3LastImport } from './import-trajectoire-snbc3.input';
import { Snbc3Release } from './snbc3-artifact.reader';

/**
 * Bucket privé de la release importée : le classeur standalone, servi par
 * l'export (lot 5), le PDF de méthodologie, servi par la page Trajectoire,
 * le manifeste et le suivi du dernier import. Créé par
 * l'import s'il n'existe pas : seul le service role y accède. Chemins fixes :
 * chaque import complet écrase les fichiers du précédent.
 */
export const SNBC3_BUCKET = 'trajectoires-snbc3';
export const SNBC3_WORKBOOK_PATH = 'standalone.xlsx';
/** PDF de méthodologie de la release ; son nom d'origine est dans les métadonnées. */
export const SNBC3_METHODOLOGIE_PATH = 'methodologie.pdf';
/**
 * `manifest.json` de la release importée, copié tel quel. Ses métadonnées
 * d'objet (`commit`, `version`) désignent la release en base.
 */
export const SNBC3_MANIFEST_PATH = 'manifest.json';
/**
 * Release du dernier import complet commencé, dans ses métadonnées d'objet :
 * écrite avant le remplacement des valeurs. Tant qu'elle diffère de celle du
 * manifeste, les valeurs mélangent deux releases (import inachevé).
 */
export const SNBC3_PENDING_RELEASE_PATH = 'pending-release.json';
/** Statut et rapport du dernier import (`Snbc3LastImport`). */
export const SNBC3_LAST_IMPORT_PATH = 'last-import.json';
const JSON_MIME_TYPE = 'application/json';
const PDF_MIME_TYPE = 'application/pdf';
const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const importedReleaseSchema = z.object({
  commit: z.string(),
  version: z.string(),
});

export type Snbc3ImportedRelease = z.infer<typeof importedReleaseSchema>;

/** Ce que le bucket garde d'une release : tout sauf le parquet. */
export type Snbc3ReleaseFiles = Pick<
  Snbc3Release,
  'sha' | 'version' | 'manifest' | 'workbook' | 'methodologie'
>;

/** Fichiers de la release importée et suivi de l'import, dans le bucket. */
@Injectable()
export class Snbc3ReleaseStorageService {
  private readonly logger = new Logger(Snbc3ReleaseStorageService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly databaseService: DatabaseService,
    private readonly documentStorageService: DocumentStorageService
  ) {}

  /** Classeur standalone, PDF de méthodologie et manifeste de la release, côte à côte. */
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
      {
        path: SNBC3_METHODOLOGIE_PATH,
        content: release.methodologie.content,
        mimeType: PDF_MIME_TYPE,
        metadata: { ...metadata, name: release.methodologie.name },
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
   * Marque le début du remplacement des valeurs d'un import complet. Tant que
   * `storeReleaseFiles` n'a pas enregistré cette même release, les rejeux
   * partiels sont refusés (cf. `getPendingRelease`).
   */
  async markReleasePending(
    release: Pick<Snbc3ReleaseFiles, 'sha' | 'version'>
  ): Promise<Result<void, ImportTrajectoireSnbc3Error>> {
    const bucket = await this.supabaseService.ensurePrivateBucket(SNBC3_BUCKET);
    if (!bucket.success) return failure('SNBC3_WORKBOOK_STORAGE_ERROR');
    const metadata = { commit: release.sha, version: release.version };
    const saved = await this.supabaseService.saveInStorage({
      bucket: SNBC3_BUCKET,
      path: SNBC3_PENDING_RELEASE_PATH,
      file: JSON.stringify(metadata),
      mimeType: JSON_MIME_TYPE,
      metadata,
    });
    if (!saved.success) return failure('SNBC3_WORKBOOK_STORAGE_ERROR');
    return success(undefined);
  }

  /**
   * Release du dernier import complet, lue dans les métadonnées de
   * `manifest.json` ; `null` avant le premier.
   */
  getImportedRelease(): Promise<Snbc3ImportedRelease | null> {
    return this.readReleaseMetadata(SNBC3_MANIFEST_PATH);
  }

  /**
   * Release que les rejeux partiels peuvent cibler : celle du dernier import
   * complet, sauf si un import complet commencé depuis (`pending-release.json`)
   * n'est pas allé au bout. Les valeurs peuvent alors mélanger deux releases :
   * `null` jusqu'à un import complet réussi.
   */
  async getReplayableRelease(): Promise<Snbc3ImportedRelease | null> {
    const [imported, pending] = await Promise.all([
      this.getImportedRelease(),
      this.readReleaseMetadata(SNBC3_PENDING_RELEASE_PATH),
    ]);
    if (
      imported &&
      pending &&
      (pending.commit !== imported.commit ||
        pending.version !== imported.version)
    ) {
      this.logger.warn(
        `L'import complet de ${pending.version}@${pending.commit} n'est pas allé au bout : relancer un import complet avant tout rejeu partiel`
      );
      return null;
    }
    return imported;
  }

  /**
   * PDF de méthodologie de la release importée, en flux, avec son nom
   * d'origine. `null` avant le premier import qui l'a stocké.
   */
  async getMethodologie(): Promise<
    Result<{ stream: Readable; fileName: string } | null, 'READ_DOCUMENT_ERROR'>
  > {
    const [object] = await this.databaseService.db
      .select({ userMetadata: storageObjectTable.userMetadata })
      .from(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, SNBC3_BUCKET),
          eq(storageObjectTable.name, SNBC3_METHODOLOGIE_PATH)
        )
      );
    if (!object) {
      return success(null);
    }
    const name = z.object({ name: z.string() }).safeParse(object.userMetadata);

    const stream = await this.documentStorageService.getDocumentStream({
      bucketId: SNBC3_BUCKET,
      key: SNBC3_METHODOLOGIE_PATH,
    });
    if (!stream.success) {
      return failure('READ_DOCUMENT_ERROR');
    }
    return success({
      stream: stream.data,
      fileName: name.success ? name.data.name : SNBC3_METHODOLOGIE_PATH,
    });
  }

  private async readReleaseMetadata(
    path: string
  ): Promise<Snbc3ImportedRelease | null> {
    const [object] = await this.databaseService.db
      .select({ userMetadata: storageObjectTable.userMetadata })
      .from(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, SNBC3_BUCKET),
          eq(storageObjectTable.name, path)
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
