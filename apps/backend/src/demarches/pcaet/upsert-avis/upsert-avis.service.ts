import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { getTitresAvisInstructeur } from '@tet/domain/demarches';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvis } from '../shared/models/pcaet-avis.dto';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { UpsertAvisError, UpsertAvisErrorEnum } from './upsert-avis.errors';
import { UpsertAvisInput } from './upsert-avis.input';

@Injectable()
export class UpsertAvisService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository
  ) {}

  /**
   * Dépose ou remplace le rapport d'un avis.
   *
   * L'enregistrement et la marque de confidentialité sont dans la même
   * transaction : séparés, un échec entre les deux laisserait le rapport
   * enregistré mais non marqué, donc lisible par tout compte vérifié dans la
   * bibliothèque de son émetteur — le conseil régional n'étant pas une
   * collectivité restreinte.
   */
  async upsertAvis(
    input: UpsertAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetAvis[], UpsertAvisError>> {
    return this.transactionManager.executeSingle(
      (transaction) => this.upsert(input, { user, tx: transaction }),
      tx
    );
  }

  private async upsert(
    { demandeAvisId, auTitreDe, fichierRef }: UpsertAvisInput,
    { user, tx }: { user: ServiceSecondArg['user']; tx: Transaction }
  ): Promise<Result<PcaetAvis[], UpsertAvisError>> {
    const permissionResult = await this.depotPermissionsService.canDeposerAvis(
      demandeAvisId,
      { user, tx }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    // Un instructeur ne se prononce qu'au titre dont il répond : le conseil
    // régional pour son président, la DREAL pour le préfet de région. Sans ce
    // contrôle, l'un signerait pour l'autre.
    const titresPermis = getTitresAvisInstructeur(
      permissionResult.data.instructeurType
    );
    if (!titresPermis.includes(auTitreDe)) {
      return failure(UpsertAvisErrorEnum.TITRE_HORS_PERIMETRE);
    }

    const emetteurCollectiviteId =
      await this.pcaetAvisRepository.getInstructeurCollectiviteId(
        demandeAvisId,
        tx
      );
    if (emetteurCollectiviteId === null) {
      return failure(UpsertAvisErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    const avisExistant = await this.pcaetAvisRepository.findByTitre(
      demandeAvisId,
      auTitreDe,
      tx
    );
    // Un avis validé est un acte rendu : le réécrire changerait sa pièce en lui
    // laissant sa date de validation, et la collectivité — qui l'a reçu — n'en
    // saurait rien. Le corriger doit être un acte explicite, pas un
    // effet de bord de l'upsert.
    if (avisExistant?.valideLe) {
      return failure(UpsertAvisErrorEnum.AVIS_DEJA_VALIDE);
    }

    await this.pcaetAvisRepository.upsert(
      {
        demandeAvisId,
        emetteurCollectiviteId,
        auTitreDe,
        fichierRef,
        deposePar: user.id,
      },
      tx
    );

    if (fichierRef !== null) {
      await this.pcaetAvisRepository.marquerPieceConfidentielle(
        { emetteurCollectiviteId, fichierRef },
        tx
      );
    }

    return success(
      await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx)
    );
  }
}
