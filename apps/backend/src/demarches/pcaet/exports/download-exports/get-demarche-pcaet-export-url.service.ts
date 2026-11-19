import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { DEMARCHE_PCAET_EXPORTS_BUCKET } from '../demarche-pcaet-exports-storage.service';
import { DemarchePcaetEventEnum } from '../../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../../shared/tracking/demarche-pcaet-tracking.service';
import {
  DemarchePcaetExportsError,
  DemarchePcaetExportsErrorEnum,
} from './demarche-pcaet-exports.errors';
import {
  pickDemarchePcaetExportRef,
  type GetDemarchePcaetExportUrlInput,
} from './demarche-pcaet-exports.input';
import type { DemarchePcaetExportUrl } from './demarche-pcaet-exports.output';
import { ResolveDemarchePcaetExportsService } from './resolve-demarche-pcaet-exports.service';

const DOWNLOAD_URL_TTL_SECONDS = 60;

/**
 * Le lien signé d'un classeur figé. Réservé aux exports figés : l'export du
 * jour se télécharge par le contrôleur, qui le construit à la demande.
 */
@Injectable()
export class GetDemarchePcaetExportUrlService {
  constructor(
    private readonly resolveService: ResolveDemarchePcaetExportsService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  async getDownloadUrl(
    input: GetDemarchePcaetExportUrlInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetExportUrl, DemarchePcaetExportsError>> {
    const resolved = await this.resolveService.resolve(
      pickDemarchePcaetExportRef(input),
      { user, tx }
    );
    if (!resolved.success) {
      return resolved;
    }
    const { sources, dossier } = resolved.data;
    if (sources.source !== 'snapshot') {
      return failure(DemarchePcaetExportsErrorEnum.EXPORT_NOT_FOUND);
    }
    const row = sources.rows[input.type];
    if (row === null) {
      return failure(DemarchePcaetExportsErrorEnum.EXPORT_NOT_FOUND);
    }

    // Le nom vient de la ligne de suivi : le front enregistre le fichier sous
    // le nom qu'on lui donne, l'URL n'a pas à le porter.
    const signedUrlResult =
      await this.documentStorageService.createSignedDownloadUrl({
        bucketId: DEMARCHE_PCAET_EXPORTS_BUCKET,
        key: row.storagePath,
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
      });
    if (!signedUrlResult.success) {
      return failure(DemarchePcaetExportsErrorEnum.EXPORT_URL_ERROR);
    }

    if (dossier) {
      this.trackingService.trackDossierInstruction(
        DemarchePcaetEventEnum.DOSSIER_TELECHARGE,
        dossier,
        {
          userId: user.id,
          properties: {
            type: `export_${input.type}`,
            source: 'snapshot',
            transition: row.transition,
          },
        }
      );
    }
    return success({
      url: signedUrlResult.data.signedUrl,
      filename: row.filename,
    });
  }
}
