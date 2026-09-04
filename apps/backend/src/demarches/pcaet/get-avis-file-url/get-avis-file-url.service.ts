import { Injectable } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import {
  GetAvisFileUrlError,
  GetAvisFileUrlErrorEnum,
} from './get-avis-file-url.errors';
import { GetAvisFileUrlInput } from './get-avis-file-url.input';
import { AvisFileUrl } from './get-avis-file-url.output';

const DOWNLOAD_URL_TTL_SECONDS = 60;

/**
 * Lien de téléchargement du rapport joint à un avis.
 *
 * Le fichier vit dans le bucket de la collectivité **émettrice** de l'avis :
 * c'est elle qui l'a déposé, et sa bibliothèque qui en porte le nom. D'où la
 * résolution par `emetteurCollectiviteId` et non par la déposante.
 */
@Injectable()
export class GetAvisFileUrlService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository,
    private readonly documentStorageService: DocumentStorageService,
    private readonly permissionService: PermissionService
  ) {}

  async getAvisFileUrl(
    { demandeAvisId, avisId }: GetAvisFileUrlInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<AvisFileUrl, GetAvisFileUrlError>> {
    const avis = await this.pcaetAvisRepository.findById(
      { demandeAvisId, avisId },
      tx
    );
    if (!avis) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_NOT_FOUND);
    }

    // Trois lecteurs légitimes, trois barrières distinctes, réunies ici pour ne
    // pas dupliquer la fabrication de l'URL signée :
    //
    // - l'instructeur saisi sur cette demande, à la même condition que la
    //   consultation du dossier — un rôle LECTURE lit les avis sans pouvoir les
    //   déposer, et voit donc aussi ses propres brouillons ;
    // - un autre destinataire du même dossier, sur les avis **validés** : une
    //   DDT ou une DR ADEME suit l'instruction sans y prendre part ;
    // - la collectivité déposante, sur les avis **validés** également.
    //
    // Le brouillon ne sort jamais de l'espace de son auteur : les deux dernières
    // barrières sont derrière le même test de validation.
    const autorise = await this.isAutorise(avis, demandeAvisId, { user, tx });
    if (!autorise) {
      return failure(GetAvisFileUrlErrorEnum.UNAUTHORIZED);
    }
    if (!avis.fichierRef) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    const emetteurCollectiviteId =
      await this.pcaetAvisRepository.getEmetteurCollectiviteId(
        { demandeAvisId, avisId },
        tx
      );
    if (emetteurCollectiviteId === null) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_NOT_FOUND);
    }

    const fichier = await this.findFichier(
      emetteurCollectiviteId,
      avis.fichierRef,
      tx
    );
    if (!fichier) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    const signedUrlResult =
      await this.documentStorageService.createDocumentSignedUrl({
        bucketId: fichier.bucketId,
        key: avis.fichierRef,
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
      });
    if (!signedUrlResult.success) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_FILE_URL_ERROR);
    }

    return success({
      url: signedUrlResult.data.signedUrl,
      filename: fichier.filename,
    });
  }

  private async isAutorise(
    avis: { valideLe: string | null },
    demandeAvisId: number,
    { user, tx }: Pick<ServiceSecondArg, 'user' | 'tx'>
  ): Promise<boolean> {
    const cotéInstructeur =
      await this.depotPermissionsService.canConsulterDepot(demandeAvisId, {
        user,
        tx,
      });
    if (cotéInstructeur.success) {
      return true;
    }

    if (avis.valideLe === null) {
      return false;
    }

    const autreDestinataire =
      await this.depotPermissionsService.canConsulterAvisDuneAutreSaisine(
        demandeAvisId,
        { user, tx }
      );
    if (autreDestinataire) {
      return true;
    }

    const deposanteCollectiviteId =
      await this.pcaetAvisRepository.getDeposanteCollectiviteId(
        demandeAvisId,
        tx
      );
    if (deposanteCollectiviteId === null) {
      return false;
    }

    const cotéDeposante = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: deposanteCollectiviteId },
      tx
    );
    return cotéDeposante.success;
  }

  /** Bucket et nom du fichier, dans la bibliothèque de l'émetteur. */
  private async findFichier(
    emetteurCollectiviteId: number,
    hash: string,
    tx?: ServiceSecondArg['tx']
  ): Promise<{ bucketId: string; filename: string } | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        bucketId: collectiviteBucketTable.bucketId,
        filename: bibliothequeFichierTable.filename,
      })
      .from(bibliothequeFichierTable)
      .innerJoin(
        collectiviteBucketTable,
        eq(
          collectiviteBucketTable.collectiviteId,
          bibliothequeFichierTable.collectiviteId
        )
      )
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, emetteurCollectiviteId),
          eq(bibliothequeFichierTable.hash, hash)
        )
      )
      .limit(1);

    const fichier = rows[0];
    if (!fichier) {
      return null;
    }
    return { bucketId: fichier.bucketId, filename: fichier.filename };
  }
}
