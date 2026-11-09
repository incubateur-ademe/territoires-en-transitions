import { Injectable } from '@nestjs/common';
import { DemarchePcaetLectureService } from '../../shared/demarche-pcaet-lecture.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  type DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
import {
  ListDemarchePcaetDocumentsError,
  ListDemarchePcaetDocumentsErrorEnum,
} from './list-documents.errors';
import { ListDemarchePcaetDocumentsInput } from './list-documents.input';

@Injectable()
export class ListDemarchePcaetDocumentsService {
  constructor(
    private readonly lectureService: DemarchePcaetLectureService,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Modèle de démarche et pièces déposées. La règle de couverture n'est pas
   * appliquée ici : l'appelant utilise les fonctions pures du domaine sur ce
   * même snapshot, comme le guard `dossierComplet`.
   */
  async listDocuments(
    input: ListDemarchePcaetDocumentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<DemarcheDocumentsSnapshot, ListDemarchePcaetDocumentsError>
  > {
    const demarche = await this.demarchePcaetRefRepository.findRef(
      input,
      undefined,
      tx
    );
    if (!demarche) {
      return failure(
        ListDemarchePcaetDocumentsErrorEnum.DEMARCHE_PCAET_NOT_FOUND
      );
    }

    // Qui édite la démarche, ou un membre d'un EPCI qu'elle couvre.
    const lectureResult = await this.lectureService.canRead(
      { collectiviteId: demarche.collectiviteId, demarcheId: demarche.id },
      { user, tx }
    );
    if (!lectureResult.success) {
      return failure(ListDemarchePcaetDocumentsErrorEnum.UNAUTHORIZED);
    }

    const snapshot = await this.demarcheDocumentsRepository.loadSnapshot(
      {
        demarcheId: demarche.id,
        demarcheType: DemarcheTypeEnum.PCAET,
        collectiviteId: demarche.collectiviteId,
      },
      tx
    );
    return success(snapshot);
  }
}
