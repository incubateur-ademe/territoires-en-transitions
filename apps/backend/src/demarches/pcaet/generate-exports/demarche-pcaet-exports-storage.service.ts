import { Injectable, Logger } from '@nestjs/common';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import {
  DEMARCHE_PCAET_EXPORT_TRANSITIONS,
  type DemarchePcaetExportTransition,
  type DemarchePcaetExportType,
} from '../shared/models/demarche-pcaet-export.table';

/**
 * Bucket privé des classeurs figés. Pas la bibliothèque de la collectivité :
 * les fichiers y seraient visibles, et dédupliqués par hash.
 */
export const DEMARCHE_PCAET_EXPORTS_BUCKET = 'demarches-pcaet-exports';

/**
 * Délai accordé à chaque appel au stockage. Les écritures ont lieu dans la
 * transaction de la transition, qui garde le verrou de ligne : un stockage
 * lent doit devenir une erreur franche bien avant que Postgres ne coupe la
 * session restée inactive en transaction (`idle_in_transaction_session_timeout`,
 * 60 s, cf. `database.service.ts`). Le bucket puis les envois en parallèle
 * restent ainsi sous les 40 s.
 */
export const STORAGE_UPLOAD_TIMEOUT_MS = 20_000;

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Un dossier par essai (`attemptId`) : un envoi d'un essai annulé qui aboutit
 * après son délai ne peut pas écraser le classeur d'un essai validé, seul
 * désigné par les lignes de suivi.
 */
export const buildDemarchePcaetExportPath = ({
  demarcheId,
  transition,
  attemptId,
  type,
}: {
  demarcheId: number;
  transition: DemarchePcaetExportTransition;
  attemptId: string;
  type: DemarchePcaetExportType;
}): string => `${demarcheId}/${transition}/${attemptId}/${type}.xlsx`;

/** Au-delà du nombre d'objets attendus sous un dossier de démarche. */
const LIST_LIMIT = 1000;

@Injectable()
export class DemarchePcaetExportsStorageService {
  private readonly logger = new Logger(DemarchePcaetExportsStorageService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Écrit les classeurs à leur chemin, propre à l'essai : jamais de
   * remplacement, un objet déjà présent est une erreur.
   *
   * En échec, la cause nomme chaque chemin non écrit et son code d'erreur, et
   * les objets de l'essai sont retirés à mesure que leurs envois se terminent
   * vraiment, y compris après le délai : l'essai n'étant désigné par aucune
   * ligne, rien de validé n'est touché.
   */
  async store(
    files: { path: string; content: Buffer }[]
  ): Promise<Result<void, 'STORAGE_ERROR'>> {
    const bucket = await withTimeout(
      this.supabaseService.ensurePrivateBucket(DEMARCHE_PCAET_EXPORTS_BUCKET),
      STORAGE_UPLOAD_TIMEOUT_MS
    ).catch(toStorageFailure);
    if (!bucket.success) {
      return failure(
        'STORAGE_ERROR',
        new Error(
          `Bucket ${DEMARCHE_PCAET_EXPORTS_BUCKET} indisponible : ${bucket.error}`
        )
      );
    }
    const pending = files.map(({ path, content }) => ({
      path,
      saving: this.supabaseService.saveInStorage({
        bucket: DEMARCHE_PCAET_EXPORTS_BUCKET,
        path,
        file: content,
        mimeType: XLSX_MIME_TYPE,
        upsert: false,
      }),
    }));
    const uploads = await Promise.all(
      pending.map(async ({ path, saving }) => ({
        path,
        upload: await withTimeout(saving, STORAGE_UPLOAD_TIMEOUT_MS).catch(
          toStorageFailure
        ),
      }))
    );
    const echecs = uploads.flatMap(({ path, upload }) =>
      upload.success ? [] : [`${path} (${upload.error})`]
    );
    if (echecs.length) {
      pending.forEach(({ path, saving }) =>
        this.discardOnceSaved(path, saving)
      );
      return failure(
        'STORAGE_ERROR',
        new Error(`Classeurs non enregistrés : ${echecs.join(', ')}`)
      );
    }
    return success(undefined);
  }

  /**
   * Retire l'objet d'un essai échoué dès que son envoi aboutit, même en retard.
   * En arrière-plan.
   */
  private discardOnceSaved(
    path: string,
    saving: Promise<{ success: boolean }>
  ): void {
    void saving
      .catch(() => ({ success: false }))
      .then(({ success: saved }) => (saved ? this.discard([path]) : undefined));
  }

  /**
   * Retire des objets qu'aucune ligne ne désigne : essai échoué, transaction
   * de la transition annulée après l'écriture, ou dépôt supprimé. Au mieux :
   * un échec est journalisé, il ne remonte pas.
   */
  async discard(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      return;
    }
    try {
      const { error } = await withTimeout(
        this.supabaseService.client.storage
          .from(DEMARCHE_PCAET_EXPORTS_BUCKET)
          .remove(paths),
        STORAGE_UPLOAD_TIMEOUT_MS
      );
      if (error) {
        throw error;
      }
    } catch (error) {
      this.logger.warn(
        `Classeurs ${paths.join(
          ', '
        )} non retirés du stockage : ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Retire tous les classeurs d'un dépôt supprimé, quel que soit l'essai qui
   * les a écrits : ceux des essais validés comme ceux laissés par une
   * transition annulée. Les lignes de suivi sont déjà parties en cascade, on
   * parcourt donc le stockage.
   *
   * Au mieux : un échec est journalisé, il ne remonte pas.
   */
  async removeAll(demarcheId: number): Promise<void> {
    let paths: string[];
    try {
      paths = (
        await Promise.all(
          DEMARCHE_PCAET_EXPORT_TRANSITIONS.map(async (transition) => {
            const transitionDir = `${demarcheId}/${transition}`;
            const attemptDirs = await this.listNames(transitionDir);
            const files = await Promise.all(
              attemptDirs.map(async (attemptId) => {
                const attemptDir = `${transitionDir}/${attemptId}`;
                return (await this.listNames(attemptDir)).map(
                  (name) => `${attemptDir}/${name}`
                );
              })
            );
            return files.flat();
          })
        )
      ).flat();
    } catch (error) {
      this.logger.warn(
        `Classeurs de la démarche PCAET ${demarcheId} non listés, donc non retirés du stockage : ${getErrorMessage(
          error
        )}`
      );
      return;
    }
    await this.discard(paths);
  }

  private async listNames(dir: string): Promise<string[]> {
    const { data, error } = await withTimeout(
      this.supabaseService.client.storage
        .from(DEMARCHE_PCAET_EXPORTS_BUCKET)
        .list(dir, { limit: LIST_LIMIT }),
      STORAGE_UPLOAD_TIMEOUT_MS
    );
    if (error) {
      throw error;
    }
    return data.map(({ name }) => name);
  }
}

/** Rejette si `promise` n'aboutit pas dans le délai ; le minuteur est levé. */
const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`STORAGE_TIMEOUT (${ms} ms)`)),
          ms
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

/** Un délai dépassé ou une exception du client : un échec comme un autre. */
const toStorageFailure = (error: unknown): Result<never, string> =>
  failure(getErrorMessage(error));
