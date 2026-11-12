import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  getTypePorteurSupra,
  type DemarchePcaetCouvrante,
} from '@tet/domain/demarches';
import { ListDemarchesPcaetRepository } from '../list-demarches-pcaet/list-demarches-pcaet.repository';
import { DemarchePcaetLectureService } from '../shared/demarche-pcaet-lecture.service';
import { DemarchePcaetPerimetreRepository } from '../shared/demarche-pcaet-perimetre.repository';
import { toDemarchePcaetPublic } from '../shared/models/demarche-pcaet-public.dto';
import {
  ListDemarchesCouvrantesError,
  ListDemarchesCouvrantesErrorEnum,
} from './list-demarches-couvrantes.errors';
import { ListDemarchesCouvrantesInput } from './list-demarches-couvrantes.input';

/**
 * Les dépôts de Supra qui couvrent la collectivité, quel que soit leur statut :
 * ses membres les retrouvent parmi ses démarches et les consultent en lecture
 * seule. Vide pour qui n'en est pas membre.
 */
@Injectable()
export class ListDemarchesCouvrantesService {
  constructor(
    private readonly lectureService: DemarchePcaetLectureService,
    private readonly perimetreRepository: DemarchePcaetPerimetreRepository,
    private readonly listDemarchesPcaetRepository: ListDemarchesPcaetRepository
  ) {}

  async listDemarchesCouvrantes(
    { collectiviteId }: ListDemarchesCouvrantesInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetCouvrante[], ListDemarchesCouvrantesError>> {
    const lectureResult = await this.lectureService.canListCouvrants(
      collectiviteId,
      { user, tx }
    );
    if (!lectureResult.success) {
      return success([]);
    }

    const couvrantes = await this.perimetreRepository.listDemarchesCouvrantes(
      collectiviteId,
      tx
    );
    const porteurs = new Map(
      couvrantes.map(({ porteur }) => [porteur.id, porteur])
    );
    const demarcheIds = new Set(couvrantes.map(({ demarcheId }) => demarcheId));

    const result: DemarchePcaetCouvrante[] = [];
    for (const porteur of porteurs.values()) {
      const listResult =
        await this.listDemarchesPcaetRepository.listDemarchesPcaet(
          { collectiviteId: porteur.id },
          tx
        );
      if (!listResult.success) {
        return failure(
          ListDemarchesCouvrantesErrorEnum.LIST_DEMARCHES_COUVRANTES_ERROR
        );
      }
      for (const demarche of listResult.data) {
        if (demarcheIds.has(demarche.id)) {
          result.push({
            ...toDemarchePcaetPublic(demarche),
            porteur: {
              id: porteur.id,
              nom: porteur.nom,
              type: getTypePorteurSupra(porteur.natureInsee),
            },
          });
        }
      }
    }
    return success(result);
  }
}
