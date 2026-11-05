import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { ArchiveAssemblyService } from '@tet/backend/utils/archive/archive-assembly.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { Writable } from 'node:stream';
import { ListAvisPiecesService } from '../shared/list-avis-pieces.service';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import {
  DownloadAvisPiecesError,
  DownloadAvisPiecesErrorEnum,
} from './download-avis-pieces.errors';
import type { DownloadAvisPiecesQuery } from './download-avis-pieces.input';
import {
  toAvisArchiveArborescence,
  toAvisArchiveFilename,
} from './to-avis-archive-arborescence';

export type PreparedAvisArchive = {
  filename: string;
  writeTo: (
    destination: Writable
  ) => Promise<Result<{ totalFiles: number }, DownloadAvisPiecesError>>;
};

/**
 * Les pièces d'un avis réunies dans une archive : un avis tient souvent en un
 * courrier et son annexe, et se télécharge d'un seul geste.
 */
@Injectable()
export class DownloadAvisPiecesService {
  constructor(
    private readonly listAvisPiecesService: ListAvisPiecesService,
    private readonly pcaetAvisRepository: PcaetAvisRepository,
    private readonly collectivitesService: CollectivitesService,
    private readonly archiveAssemblyService: ArchiveAssemblyService
  ) {}

  /** Tout ce qui peut échouer avant l'envoi des en-têtes. */
  async prepareArchive(
    { demandeAvisId, avisId }: DownloadAvisPiecesQuery,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PreparedAvisArchive, DownloadAvisPiecesError>> {
    const piecesResult = await this.listAvisPiecesService.listAvisPieces(
      { demandeAvisId, avisId },
      { user, tx }
    );
    if (!piecesResult.success) {
      return failure(piecesResult.error);
    }
    const { emetteurCollectiviteId, pieces } = piecesResult.data;

    const arborescence = toAvisArchiveArborescence(pieces);
    if (arborescence.files.length === 0) {
      return failure(DownloadAvisPiecesErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    const deposanteCollectiviteId =
      await this.pcaetAvisRepository.getDeposanteCollectiviteId(
        demandeAvisId,
        tx
      );
    if (deposanteCollectiviteId === null) {
      return failure(DownloadAvisPiecesErrorEnum.AVIS_NOT_FOUND);
    }
    const [{ collectivite: emetteur }, { collectivite: deposante }] =
      await Promise.all([
        this.collectivitesService.getCollectivite(emetteurCollectiviteId, tx),
        this.collectivitesService.getCollectivite(deposanteCollectiviteId, tx),
      ]);

    return success({
      filename: toAvisArchiveFilename({
        emetteurNom: emetteur.nom,
        deposanteNom: deposante.nom,
      }),
      writeTo: async (destination: Writable) => {
        const assembleResult = await this.archiveAssemblyService.assembleZip({
          arborescence,
          destination,
        });
        return assembleResult.success
          ? success(assembleResult.data)
          : failure(DownloadAvisPiecesErrorEnum.BUILD_ARCHIVE_ERROR);
      },
    });
  }
}
