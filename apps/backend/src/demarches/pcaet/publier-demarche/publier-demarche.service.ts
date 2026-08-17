import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { PublierDemarchePcaetError } from './publier-demarche.errors';

@Injectable()
export class PublierDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService
  ) {}

  /**
   * Met le dossier à disposition du public.
   *
   * Effet propre : la date de mise en ligne, que l'interface affiche.
   */
  async publier(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, PublierDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.PUBLIER,
      { user, tx },
      () => ({ publishedAt: new Date().toISOString() })
    );
  }
}
