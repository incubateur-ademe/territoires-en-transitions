import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { AdopterDemarchePcaetError } from './adopter-demarche.errors';

@Injectable()
export class AdopterDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService
  ) {}

  /**
   * Acte l'adoption du PCAET : le dossier entre en mise en œuvre pour 6 ans.
   *
   * Sans effet propre : seuls le statut et le journal changent.
   */
  async adopter(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, AdopterDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.ADOPTER,
      { user, tx }
    );
  }
}
