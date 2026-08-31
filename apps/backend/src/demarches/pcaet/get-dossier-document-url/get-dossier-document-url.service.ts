import { Injectable } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { eq } from 'drizzle-orm';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
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
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly documentStorageService: DocumentStorageService
  ) {}

  async getDossierDocumentUrl(
    { demandeAvisId, documentId }: GetDossierDocumentUrlInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DossierDocumentUrl, GetDossierDocumentUrlError>> {
    const permissionResult =
      await this.depotPermissionsService.canConsulterDepot(demandeAvisId, {
        user,
        tx,
      });
    if (!permissionResult.success) {
      return failure(GetDossierDocumentUrlErrorEnum.UNAUTHORIZED);
    }

    // La collectivité déposante conditionne le catalogue servi : l'instructeur
    // doit voir le dossier tel qu'il est attendu d'elle, pas un modèle générique.
    const rows = await (tx ?? this.databaseService.db)
      .select({
        demarcheId: pcaetDemandeAvisTable.demarcheId,
        collectiviteId: demarcheTable.collectiviteId,
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    const demande = rows[0];
    if (!demande) {
      return failure(GetDossierDocumentUrlErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    const snapshot = await this.demarcheDocumentsRepository.loadSnapshot(
      {
        demarcheId: demande.demarcheId,
        demarcheType: DemarcheTypeEnum.PCAET,
        collectiviteId: demande.collectiviteId,
      },
      tx
    );

    const document = snapshot.documents.find(
      (depose) => depose.documentId === documentId
    );
    const fichier = document?.fichier;
    if (!fichier?.bucketId) {
      return failure(GetDossierDocumentUrlErrorEnum.DOCUMENT_NOT_FOUND);
    }

    const signedUrlResult =
      await this.documentStorageService.createDocumentSignedUrl({
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
