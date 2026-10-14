import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarchePcaetTransitionEnum,
  getDateCivileFrance,
  isDateAdoptionPcaetRecevable,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { ArchiverDemarchePcaetService } from '../archiver-demarche/archiver-demarche.service';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import {
  PublierDemarchePcaetError,
  PublierDemarchePcaetErrorEnum,
} from './publier-demarche.errors';
import { PublierDemarchePcaetInput } from './publier-demarche.input';

@Injectable()
export class PublierDemarchePcaetService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly archiverService: ArchiverDemarchePcaetService
  ) {}

  /**
   * Met le dossier à disposition du public.
   *
   * Effets propres : la date de mise en ligne, que l'interface affiche, et la
   * date de la délibération d'adoption saisie par la collectivité — les deux ne
   * tombent pas le même jour, et c'est l'adoption qui fait foi pour la validité
   * du PCAET. Le PCAET précédent, remplacé, est archivé dans la même
   * transaction.
   */
  async publier(
    input: PublierDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, PublierDemarchePcaetError>> {
    // Une délibération est un acte déjà pris : la dater du futur avancerait le
    // départ des six ans de validité, donc l'échéance de renouvellement que la
    // plateforme surveille. Le `max` de la modale ne défend pas cette
    // invariante — un appel direct à la mutation la contournerait.
    if (
      !isDateAdoptionPcaetRecevable(
        input.dateAdoption,
        getDateCivileFrance(new Date())
      )
    ) {
      return failure(PublierDemarchePcaetErrorEnum.DATE_ADOPTION_FUTURE);
    }

    return this.transactionManager.executeSingle(async (transaction) => {
      const publication = await this.transitionService.apply(
        input,
        DemarchePcaetTransitionEnum.PUBLIER,
        { user, tx: transaction },
        () => ({
          publishedAt: new Date().toISOString(),
          adoptedAt: input.dateAdoption,
        })
      );
      if (!publication.success) {
        return publication;
      }

      const archivage = await this.archiverService.archiverRemplacees(
        { collectiviteId: publication.data.collectiviteId },
        { tx: transaction }
      );
      if (!archivage.success) {
        return archivage;
      }

      // Une date d'adoption antérieure à celle d'un PCAET déjà publié fait de
      // ce dépôt le précédent : c'est lui que la passe vient d'archiver.
      const publiee = archivage.data.find(
        (demarche) => demarche.id === publication.data.id
      );
      return success(publiee ?? publication.data);
    }, tx);
  }
}
