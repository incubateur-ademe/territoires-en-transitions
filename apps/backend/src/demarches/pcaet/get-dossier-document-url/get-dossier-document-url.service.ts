import { Injectable } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import type { DossierInstructionRef } from '../shared/dossier-instruction-ref.input';
import {
  GetDossierDocumentUrlError,
  GetDossierDocumentUrlErrorEnum,
} from './get-dossier-document-url.errors';
import { GetDossierDocumentUrlInput } from './get-dossier-document-url.input';
import { DossierDocumentUrl } from './get-dossier-document-url.output';

const DOWNLOAD_URL_TTL_SECONDS = 60;

@Injectable()
export class GetDossierDocumentUrlService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly documentStorageService: DocumentStorageService
  ) {}

  async getDossierDocumentUrl(
    input: GetDossierDocumentUrlInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DossierDocumentUrl, GetDossierDocumentUrlError>> {
    // L'intersection ne se laisse pas destructurer en gardant son discriminant :
    // la clé du dossier est reconstruite pour le préambule.
    const ref: DossierInstructionRef =
      'demandeAvisId' in input
        ? { demandeAvisId: input.demandeAvisId }
        : { demarcheId: input.demarcheId };

    const consultableResult =
      await this.depotPermissionsService.canConsulterDossier(ref, {
        user,
        tx,
      });
    if (!consultableResult.success) {
      return failure(
        consultableResult.error === 'DEMANDE_AVIS_NOT_FOUND'
          ? consultableResult.error
          : consultableResult.error === 'NOT_FOUND'
          ? GetDossierDocumentUrlErrorEnum.DEMARCHE_PCAET_NOT_FOUND
          : GetDossierDocumentUrlErrorEnum.UNAUTHORIZED
      );
    }
    const { demarcheId, collectiviteId } = consultableResult.data;

    // La collectivité déposante conditionne le catalogue servi : l'instructeur
    // doit voir le dossier tel qu'il est attendu d'elle, pas un modèle générique.
    const snapshot = await this.demarcheDocumentsRepository.loadSnapshot(
      {
        demarcheId,
        demarcheType: DemarcheTypeEnum.PCAET,
        collectiviteId,
      },
      tx
    );

    const document = snapshot.documents.find(
      (depose) => depose.documentId === input.documentId
    );
    const fichier = document?.fichier;
    if (!fichier?.bucketId) {
      return failure(GetDossierDocumentUrlErrorEnum.DOCUMENT_NOT_FOUND);
    }

    const signedUrlResult =
      await this.documentStorageService.createSignedDownloadUrl({
        bucketId: fichier.bucketId,
        key: fichier.hash,
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
      });
    if (!signedUrlResult.success) {
      return failure(GetDossierDocumentUrlErrorEnum.DOCUMENT_URL_ERROR);
    }

    return success({
      url: signedUrlResult.data.signedUrl,
      filename: fichier.filename,
    });
  }
}
