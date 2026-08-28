import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getTitresAvisInstructeur } from '@tet/domain/demarches';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvis } from '../shared/models/pcaet-avis.dto';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { UpsertAvisError, UpsertAvisErrorEnum } from './upsert-avis.errors';
import { UpsertAvisInput } from './upsert-avis.input';

@Injectable()
export class UpsertAvisService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository
  ) {}

  async upsertAvis(
    { demandeAvisId, auTitreDe, sens, fichierRef }: UpsertAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetAvis[], UpsertAvisError>> {
    const permissionResult = await this.depotPermissionsService.canDeposerAvis(
      demandeAvisId,
      { user, tx }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    // Un instructeur ne se prononce qu'aux titres dont il répond : le conseil
    // régional pour son président, la DREAL pour le préfet de région et
    // l'autorité environnementale. Sans ce contrôle, l'un signerait pour
    // l'autre.
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
    // Un avis validé est un acte rendu : le réécrire changerait son sens ou sa
    // pièce en lui laissant sa date de validation, et la collectivité — qui l'a
    // reçu — n'en saurait rien. Le corriger doit être un acte explicite, pas un
    // effet de bord de l'upsert.
    if (avisExistant?.valideLe) {
      return failure(UpsertAvisErrorEnum.AVIS_DEJA_VALIDE);
    }

    await this.pcaetAvisRepository.upsert(
      {
        demandeAvisId,
        emetteurCollectiviteId,
        auTitreDe,
        sens,
        fichierRef,
        deposePar: user.id,
      },
      tx
    );

    return success(
      await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx)
    );
  }
}
