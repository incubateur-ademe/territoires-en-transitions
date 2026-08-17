import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { DepublierDemarchePcaetError } from './depublier-demarche.errors';

@Injectable()
export class DepublierDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService
  ) {}

  /**
   * Retire le dossier de la consultation publique et le ramène à l'adoption.
   *
   * Effet propre : la date de mise en ligne est effacée — une republication en
   * inscrira une nouvelle.
   */
  async depublier(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, DepublierDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.DEPUBLIER,
      { user, tx },
      () => ({ publishedAt: null })
    );
  }
}
