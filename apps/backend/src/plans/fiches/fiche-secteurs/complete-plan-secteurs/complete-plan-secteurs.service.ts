import { Injectable, Logger } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { setTimeout } from 'node:timers/promises';
import { CompleteFicheSecteursService } from '../complete-fiche-secteurs.service';
import { FicheSecteursEligibiliteRepository } from '../fiche-secteurs-eligibilite.repository';
import {
  CompletePlanSecteursJobData,
  MAX_PASSAGES,
  NEXT_PASSAGE_DELAYS_MS,
} from './complete-plan-secteurs.queue';
import { EnqueueCompletePlanSecteursService } from './enqueue-complete-plan-secteurs.service';

const BATCH_SIZE = 100;
const COMMUNS_REQUESTS_PER_MINUTE = 500;
const MAX_COMMUNS_REQUESTS_PER_FICHE = 2;
const MIN_INTERVAL_MS =
  (60_000 * MAX_COMMUNS_REQUESTS_PER_FICHE) / COMMUNS_REQUESTS_PER_MINUTE;

@Injectable()
export class CompletePlanSecteursService {
  private readonly logger = new Logger(CompletePlanSecteursService.name);

  constructor(
    private readonly eligibiliteRepository: FicheSecteursEligibiliteRepository,
    private readonly completeFicheSecteursService: CompleteFicheSecteursService,
    private readonly enqueueCompletePlanSecteursService: EnqueueCompletePlanSecteursService
  ) {}

  async completePlan(
    data: CompletePlanSecteursJobData
  ): Promise<
    Result<
      { enCoursDeCalcul: number },
      CommonError | 'ENQUEUE_NEXT_PASSAGE_ERROR'
    >
  > {
    let enCoursDeCalcul: number;
    try {
      enCoursDeCalcul = await this.completeFiches(data);
    } catch (error) {
      this.logger.error(
        `Rattrapage des secteurs du plan ${data.planId} interrompu`,
        error
      );
      return failure(CommonErrorEnum.DATABASE_ERROR, error as Error);
    }
    this.logger.log(
      `Plan ${data.planId}, passage ${data.passage} : ${enCoursDeCalcul} fiches en cours de calcul`
    );
    if (enCoursDeCalcul > 0 && data.passage < MAX_PASSAGES) {
      const enqueued =
        await this.enqueueCompletePlanSecteursService.enqueueNextPassage(
          data,
          NEXT_PASSAGE_DELAYS_MS[data.passage - 1]
        );
      if (!enqueued.success) {
        return enqueued;
      }
    }
    return success({ enCoursDeCalcul });
  }

  private async completeFiches({
    planId,
    collectiviteId,
  }: CompletePlanSecteursJobData): Promise<number> {
    let enCoursDeCalcul = 0;
    let afterFicheId = 0;
    for (;;) {
      const ficheIds =
        await this.eligibiliteRepository.listFichesConcerneesSansAttribution({
          afterFicheId,
          limit: BATCH_SIZE,
          collectiviteId,
          planId,
        });
      if (ficheIds.length === 0) {
        return enCoursDeCalcul;
      }
      afterFicheId = ficheIds[ficheIds.length - 1];

      for (const ficheId of ficheIds) {
        const startedAt = Date.now();
        const secteurs =
          await this.completeFicheSecteursService.completeSecteurs(ficheId);
        if (!secteurs.success || secteurs.data.etat === 'en_cours_de_calcul') {
          enCoursDeCalcul++;
        }
        await setTimeout(
          Math.max(0, MIN_INTERVAL_MS - (Date.now() - startedAt))
        );
      }
    }
  }
}
