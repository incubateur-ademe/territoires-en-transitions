import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { AntivirusScanner } from './antivirus-scanner';
import {
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
};

export type SweepFichiersError = 'SCANNER_UNAVAILABLE' | 'DATABASE_ERROR';

/**
 * Balayage antivirus des buckets de collectivité, en mode audit : chaque
 * verdict est consigné, aucun fichier n'est supprimé. Un balayage s'arrête
 * net si clamd ne répond plus, plutôt que de compter des erreurs sur chaque
 * objet du lot.
 */
@Injectable()
export class ScanFichiersService {
  private readonly logger = new Logger(ScanFichiersService.name);

  constructor(
    private readonly scanner: AntivirusScanner,
    private readonly repository: ScanFichiersRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly configurationService: ConfigurationService
  ) {}

  async sweep(): Promise<Result<SweepFichiersReport, SweepFichiersError>> {
    const report: SweepFichiersReport = {
      skipped: false,
      scanned: 0,
      clean: 0,
      infected: 0,
      errors: 0,
    };

    if (!this.scanner.isEnabled()) {
      return success({ ...report, skipped: true });
    }

    const engineVersion = await this.scanner.getEngineVersion();
    if (!engineVersion.success) {
      this.logger.error('Balayage antivirus annulé : clamd injoignable');
      return failure('SCANNER_UNAVAILABLE');
    }

    let objects: ObjectToScan[];
    try {
      objects = await this.repository.listObjectsToScan({
        limit: Number(this.configurationService.get('FICHIER_SCAN_BATCH_SIZE')),
        maxAttempts: MAX_SCAN_ATTEMPTS,
      });
    } catch (error) {
      this.logger.error(
        `Sélection des fichiers à analyser impossible : ${getErrorMessage(
          error
        )}`
      );
      return failure('DATABASE_ERROR');
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

    if (report.scanned > 0) {
      this.logger.log(
        `Balayage antivirus : ${report.scanned} analysé(s), ${report.clean} sain(s), ${report.infected} infecté(s), ${report.errors} en erreur`
      );
    }
    return success(report);
  }

  private async scanObject(
    object: ObjectToScan,
    engineVersion: string
  ): Promise<'clean' | 'infected' | 'errors' | 'unavailable'> {
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
      this.logger.warn(
        `Fichier infecté (audit, non supprimé) : ${object.bucketId}/${object.objectName} — ${verdict.data.signature}`
      );
      await this.repository.upsertVerdict({
        ...object,
        status: 'infected',
        signature: verdict.data.signature,
        engineVersion,
      });
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
}
