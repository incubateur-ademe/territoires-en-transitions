import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { ListAvisPiecesService } from '../shared/list-avis-pieces.service';
import {
  GetAvisFileUrlError,
  GetAvisFileUrlErrorEnum,
} from './get-avis-file-url.errors';
import { GetAvisFileUrlInput } from './get-avis-file-url.input';
import { AvisFileUrl } from './get-avis-file-url.output';

const DOWNLOAD_URL_TTL_SECONDS = 60;

/**
 * Lien de téléchargement de la pièce d'un avis qui n'en porte qu'une. Au-delà,
 * les pièces se téléchargent ensemble par l'archive de l'avis.
 */
@Injectable()
export class GetAvisFileUrlService {
  constructor(
    private readonly listAvisPiecesService: ListAvisPiecesService,
    private readonly documentStorageService: DocumentStorageService
  ) {}

  async getAvisFileUrl(
    { demandeAvisId, avisId }: GetAvisFileUrlInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<AvisFileUrl, GetAvisFileUrlError>> {
    const piecesResult = await this.listAvisPiecesService.listAvisPieces(
      { demandeAvisId, avisId },
      { user, tx }
    );
    if (!piecesResult.success) {
      return failure(piecesResult.error);
    }
    const { pieces } = piecesResult.data;

    if (pieces.length > 1) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_PLUSIEURS_PIECES);
    }
    const [piece] = pieces;
    if (piece.bucketId === null) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    const signedUrlResult =
      await this.documentStorageService.createSignedDownloadUrl({
        bucketId: piece.bucketId,
        key: piece.hash,
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
      });
    if (!signedUrlResult.success) {
      return failure(GetAvisFileUrlErrorEnum.AVIS_FILE_URL_ERROR);
    }

    return success({
      url: signedUrlResult.data.signedUrl,
      filename: piece.filename,
    });
  }
}
