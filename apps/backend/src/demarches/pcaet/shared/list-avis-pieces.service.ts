import { Injectable } from '@nestjs/common';
import { buildFilesizeSql } from '@tet/backend/collectivites/documents/file-info.utils';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { DocumentHash } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { DepotPermissionsService } from './depot-permissions.service';
import { PcaetAvis } from './models/pcaet-avis.dto';
import { PcaetAvisRepository } from './pcaet-avis.repository';

export const ListAvisPiecesErrorEnum = createErrorsEnum([
  'AVIS_NOT_FOUND',
  'AVIS_SANS_PIECE_JOINTE',
] as const);
export type ListAvisPiecesError = keyof typeof ListAvisPiecesErrorEnum;

export type AvisPiece = {
  hash: DocumentHash;
  filename: string;
  bucketId: string | null;
  filesize: number | null;
};

/**
 * Les pièces d'un avis que cet utilisateur peut télécharger, dans l'ordre du
 * dépôt.
 *
 * Elles vivent dans la bibliothèque de la collectivité **émettrice** : c'est
 * elle qui les a déposées. D'où la résolution par `emetteurCollectiviteId` et
 * non par la déposante.
 */
@Injectable()
export class ListAvisPiecesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository,
    private readonly permissionService: PermissionService
  ) {}

  async listAvisPieces(
    { demandeAvisId, avisId }: { demandeAvisId: number; avisId: string },
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<
      { avis: PcaetAvis; emetteurCollectiviteId: number; pieces: AvisPiece[] },
      ListAvisPiecesError
    >
  > {
    const avis = await this.pcaetAvisRepository.findById(
      { demandeAvisId, avisId },
      tx
    );
    if (!avis) {
      return failure(ListAvisPiecesErrorEnum.AVIS_NOT_FOUND);
    }

    const autorise = await this.isAutorise(avis, demandeAvisId, { user, tx });
    if (!autorise) {
      return failure(ListAvisPiecesErrorEnum.UNAUTHORIZED);
    }

    const emetteurCollectiviteId =
      await this.pcaetAvisRepository.getEmetteurCollectiviteId(
        { demandeAvisId, avisId },
        tx
      );
    if (emetteurCollectiviteId === null) {
      return failure(ListAvisPiecesErrorEnum.AVIS_NOT_FOUND);
    }

    const pieces = await this.listPiecesEnBibliotheque(
      emetteurCollectiviteId,
      avis.fichierRefs,
      tx
    );
    if (pieces.length === 0) {
      return failure(ListAvisPiecesErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    return success({ avis, emetteurCollectiviteId, pieces });
  }

  private async listPiecesEnBibliotheque(
    collectiviteId: number,
    fichierRefs: DocumentHash[],
    tx: ServiceSecondArg['tx']
  ): Promise<AvisPiece[]> {
    if (fichierRefs.length === 0) {
      return [];
    }
    const rows = await (tx ?? this.databaseService.db)
      .select({
        hash: bibliothequeFichierTable.hash,
        filename: bibliothequeFichierTable.filename,
        bucketId: collectiviteBucketTable.bucketId,
        filesize: buildFilesizeSql(),
      })
      .from(bibliothequeFichierTable)
      .leftJoin(
        collectiviteBucketTable,
        eq(
          collectiviteBucketTable.collectiviteId,
          bibliothequeFichierTable.collectiviteId
        )
      )
      .leftJoin(
        storageObjectTable,
        and(
          eq(storageObjectTable.bucketId, collectiviteBucketTable.bucketId),
          eq(storageObjectTable.name, bibliothequeFichierTable.hash)
        )
      )
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
          inArray(bibliothequeFichierTable.hash, fichierRefs)
        )
      );

    const parHash = new Map(rows.map((row) => [row.hash, row]));
    return fichierRefs.flatMap((hash) => {
      const row = parHash.get(hash);
      return row
        ? [
            {
              hash,
              filename: row.filename,
              bucketId: row.bucketId ?? null,
              filesize: row.filesize ?? null,
            },
          ]
        : [];
    });
  }

  // Trois lecteurs légitimes, trois barrières distinctes :
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
    if (autreDestinataire.success) {
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
}
