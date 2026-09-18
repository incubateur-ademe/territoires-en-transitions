import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { PublierDemarchePcaetError } from './publier-demarche.errors';
import { PublierDemarchePcaetInput } from './publier-demarche.input';

@Injectable()
export class PublierDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService
  ) {}

  /**
   * Met le dossier à disposition du public.
   *
   * Effets propres : la date de mise en ligne, que l'interface affiche, et la
   * date de la délibération d'adoption saisie par la collectivité — les deux ne
   * tombent pas le même jour, et c'est l'adoption qui fait foi pour la validité
   * du PCAET.
   */
  async publier(
    input: PublierDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, PublierDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.PUBLIER,
      { user, tx },
      () => ({
        publishedAt: new Date().toISOString(),
        adoptedAt: input.dateAdoption,
      })
    );
  }
}
