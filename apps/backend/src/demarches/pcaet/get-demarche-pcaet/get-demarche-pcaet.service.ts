import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  toDemarchePcaetLectureSeule,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetLectureService } from '../shared/demarche-pcaet-lecture.service';
import {
  GetDemarchePcaetError,
  GetDemarchePcaetErrorEnum,
} from './get-demarche-pcaet.errors';
import { GetDemarchePcaetInput } from './get-demarche-pcaet.input';
import { GetDemarchePcaetRepository } from './get-demarche-pcaet.repository';

@Injectable()
export class GetDemarchePcaetService {
  constructor(
    private readonly lectureService: DemarchePcaetLectureService,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService
  ) {}

  async getDemarchePcaet(
    input: GetDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, GetDemarchePcaetError>> {
    // Qui édite la démarche, ou, en lecture seule, un membre d'un EPCI qu'elle
    // couvre.
    const lectureResult = await this.lectureService.canRead(input, {
      user,
      tx,
    });
    if (!lectureResult.success) {
      return failure(GetDemarchePcaetErrorEnum.UNAUTHORIZED);
    }

    const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
      input,
      tx
    );
    if (!getResult.success) {
      return getResult;
    }
    const demarche = await this.guardsService.enrich(getResult.data, user, tx);
    return {
      success: true,
      data: lectureResult.data.lectureSeule
        ? toDemarchePcaetLectureSeule(demarche)
        : demarche,
    };
  }
}
