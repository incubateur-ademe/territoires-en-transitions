import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { ReprendreElaborationDemarchePcaetError } from './reprendre-elaboration.errors';

@Injectable()
export class ReprendreElaborationDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService
  ) {}

  /**
   * Rouvre le dossier à l'édition après une transmission : les instances
   * consultatives ne sont plus saisies tant qu'il n'est pas retransmis.
   *
   * Sans effet propre : seuls le statut et le journal changent.
   */
  async reprendre(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, ReprendreElaborationDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.REPRENDRE_ELABORATION,
      { user, tx }
    );
  }
}
