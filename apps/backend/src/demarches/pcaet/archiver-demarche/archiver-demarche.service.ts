import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { ArchiverDemarchePcaetError } from './archiver-demarche.errors';

@Injectable()
export class ArchiverDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService
  ) {}

  /**
   * Clôt le cycle : l'évaluation finale est déposée, un renouvellement peut
   * démarrer.
   *
   * Sans effet propre : seuls le statut et le journal changent.
   */
  async archiver(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, ArchiverDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.ARCHIVER,
      { user, tx }
    );
  }
}
