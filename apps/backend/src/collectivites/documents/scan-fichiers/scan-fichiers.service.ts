import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { AntivirusScanner } from './antivirus-scanner';
import { NotifyFichierInfecteService } from './notify-fichier-infecte/notify-fichier-infecte.service';
import type { ScanFichierJobData } from './scan-fichiers.queue';
import {
  type InfectedObject,
  type ObjectToScan,
  ScanFichiersRepository,
} from './scan-fichiers.repository';

/** Au-delà, un objet reste en `error` : il relève d'un examen à la main. */
export const MAX_SCAN_ATTEMPTS = 3;

export type SweepFichiersReport = {
  skipped: boolean;
  scanned: number;
  clean: number;
  infected: number;
  errors: number;
  deleted: number;
};

export type SweepFichiersError = 'SCANNER_UNAVAILABLE' | 'DATABASE_ERROR';

export type ScanFichierOutcome =
  | 'skipped'
  | 'already-scanned'
  | 'clean'
  | 'infected'
  | 'errors';

type ScanOutcome = 'clean' | 'infected' | 'errors' | 'unavailable';

/**
 * Analyse antivirus des buckets de collectivité, par deux chemins :
 * - chaque dépôt met son fichier en file (`scanFichier`) ;
 * - un balayage périodique (`sweep`) rattrape ce qui a échappé à la file :
 *   écriture directe dans le bucket, clamd indisponible, stock existant.
 *
 * En mode `audit`, chaque verdict est consigné et rien n'est supprimé. En
 * mode `enforce`, un fichier infecté est supprimé du stockage et les
 * administrateurs de sa collectivité sont prévenus ; ses lignes métier sont
 * conservées. On ne supprime jamais sans verdict positif.
 */
@Injectable()
export class ScanFichiersService {
  private readonly logger = new Logger(ScanFichiersService.name);

  constructor(
    private readonly scanner: AntivirusScanner,
    private readonly repository: ScanFichiersRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly configurationService: ConfigurationService,
    private readonly notifyFichierInfecte: NotifyFichierInfecteService
  ) {}

  isEnabled(): boolean {
    return this.scanner.isEnabled();
  }

  private isEnforced(): boolean {
    return this.configurationService.get('FICHIER_SCAN_MODE') === 'enforce';
  }

  async sweep(): Promise<Result<SweepFichiersReport, SweepFichiersError>> {
    const report: SweepFichiersReport = {
      skipped: false,
      scanned: 0,
      clean: 0,
      infected: 0,
      errors: 0,
      deleted: 0,
    };

    if (!this.scanner.isEnabled()) {
      return success({ ...report, skipped: true });
    }

    const engineVersion = await this.scanner.getEngineVersion();
    if (!engineVersion.success) {
      this.logger.error('Balayage antivirus annulé : clamd injoignable');
      return failure('SCANNER_UNAVAILABLE');
    }

    const limit = Number(
      this.configurationService.get('FICHIER_SCAN_BATCH_SIZE')
    );

    let objects: ObjectToScan[];
    let infectedObjects: InfectedObject[] = [];
    try {
      objects = await this.repository.listObjectsToScan({
        limit,
        maxAttempts: MAX_SCAN_ATTEMPTS,
      });
      if (this.isEnforced()) {
        infectedObjects = await this.repository.listInfectedObjects({ limit });
      }
    } catch (error) {
      this.logger.error(
        `Sélection des fichiers à analyser impossible : ${getErrorMessage(
          error
        )}`
      );
      return failure('DATABASE_ERROR');
    }

    for (const object of infectedObjects) {
      if (await this.deleteInfectedObject(object)) {
        report.deleted += 1;
      }
    }

    for (const object of objects) {
      const outcome = await this.scanObject(object, engineVersion.data);
      if (outcome === 'unavailable') {
        this.logger.error(
          `Balayage antivirus interrompu après ${report.scanned} fichier(s) : clamd injoignable`
        );
        return failure('SCANNER_UNAVAILABLE');
      }
      report.scanned += 1;
      report[outcome] += 1;
    }

    if (report.scanned > 0 || report.deleted > 0) {
      this.logger.log(
        `Balayage antivirus : ${report.scanned} analysé(s), ${report.clean} sain(s), ${report.infected} infecté(s), ${report.errors} en erreur, ${report.deleted} supprimé(s) au rattrapage`
      );
    }
    return success(report);
  }

  /**
   * Analyse d'un fichier juste déposé. Un fichier déjà jugé n'est pas
   * réanalysé ; jugé infecté, il est à nouveau supprimé s'il est réapparu.
   */
  async scanFichier({
    collectiviteId,
    hash,
  }: ScanFichierJobData): Promise<
    Result<ScanFichierOutcome, SweepFichiersError>
  > {
    if (!this.scanner.isEnabled()) {
      return success('skipped');
    }

    let object: ObjectToScan;
    try {
      const bucketId = await this.repository.findBucketId(collectiviteId);
      if (bucketId === undefined) {
        return success('skipped');
      }
      object = { bucketId, objectName: hash };

      const verdict = await this.repository.findVerdict(object);
      if (verdict && verdict.status !== 'error') {
        if (verdict.status === 'infected' && this.isEnforced()) {
          await this.deleteInfectedObject({
            ...object,
            signature: verdict.signature ?? '',
          });
        }
        return success('already-scanned');
      }
    } catch (error) {
      this.logger.error(
        `Lecture du verdict de ${collectiviteId}/${hash} impossible : ${getErrorMessage(
          error
        )}`
      );
      return failure('DATABASE_ERROR');
    }

    const engineVersion = await this.scanner.getEngineVersion();
    if (!engineVersion.success) {
      return failure('SCANNER_UNAVAILABLE');
    }

    const outcome = await this.scanObject(object, engineVersion.data);
    if (outcome === 'unavailable') {
      return failure('SCANNER_UNAVAILABLE');
    }
    return success(outcome);
  }

  private async scanObject(
    object: ObjectToScan,
    engineVersion: string
  ): Promise<ScanOutcome> {
    const location = { bucketId: object.bucketId, key: object.objectName };

    const stream = await this.documentStorage.getDocumentStream(location);
    if (!stream.success) {
      await this.repository.upsertVerdict({
        ...object,
        status: 'error',
        signature: null,
        engineVersion,
      });
      return 'errors';
    }

    const verdict = await this.scanner.scan(stream.data);
    stream.data.destroy();

    if (!verdict.success) {
      if (verdict.error === 'SCANNER_UNAVAILABLE') {
        return 'unavailable';
      }
      this.logger.warn(
        `Analyse impossible de ${object.bucketId}/${object.objectName} : ${
          verdict.cause?.message ?? verdict.error
        }`
      );
      await this.repository.upsertVerdict({
        ...object,
        status: 'error',
        signature: null,
        engineVersion,
      });
      return 'errors';
    }

    if (verdict.data.status === 'infected') {
      const { signature } = verdict.data;
      await this.repository.upsertVerdict({
        ...object,
        status: 'infected',
        signature,
        engineVersion,
      });
      if (this.isEnforced()) {
        await this.deleteInfectedObject({ ...object, signature });
      } else {
        this.logger.warn(
          `Fichier infecté (audit, non supprimé) : ${object.bucketId}/${object.objectName} — ${signature}`
        );
      }
      return 'infected';
    }

    await this.repository.upsertVerdict({
      ...object,
      status: 'clean',
      signature: null,
      engineVersion,
    });
    return 'clean';
  }

  /** Vrai si le blob a été supprimé. Les administrateurs ne sont prévenus qu'une fois. */
  private async deleteInfectedObject(object: InfectedObject): Promise<boolean> {
    const removed = await this.documentStorage.removeDocument({
      bucketId: object.bucketId,
      key: object.objectName,
    });
    if (!removed.success) {
      // Réessayé au prochain balayage, tant que l'objet existe.
      this.logger.error(
        `Fichier infecté NON supprimé : ${object.bucketId}/${object.objectName} — ${object.signature}`
      );
      return false;
    }

    // `error` et non `warn` : chaque suppression doit remonter à l'équipe.
    this.logger.error(
      `Fichier infecté supprimé : ${object.bucketId}/${object.objectName} — ${object.signature}`
    );

    try {
      const isFirstDeletion = await this.repository.markDeleted(object);
      if (isFirstDeletion) {
        await this.notifyFichierInfecte.notify(object);
      }
    } catch (error) {
      this.logger.error(
        `Suppression de ${object.bucketId}/${
          object.objectName
        } non consignée : ${getErrorMessage(error)}`
      );
    }
    return true;
  }
}
