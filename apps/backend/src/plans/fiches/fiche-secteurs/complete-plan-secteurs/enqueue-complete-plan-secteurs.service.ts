import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import {
  COMPLETE_PLAN_SECTEURS_JOB_NAME,
  COMPLETE_PLAN_SECTEURS_QUEUE_NAME,
  buildNextPassageJobId,
  CompletePlanSecteursJobData,
} from './complete-plan-secteurs.queue';

@Injectable()
export class EnqueueCompletePlanSecteursService implements OnModuleInit {
  private readonly logger = new Logger(EnqueueCompletePlanSecteursService.name);

  constructor(
    @InjectQueue(COMPLETE_PLAN_SECTEURS_QUEUE_NAME)
    private readonly queue: Queue<CompletePlanSecteursJobData>,
    private readonly trackingService: TrackingService
  ) {}

  async onModuleInit() {
    try {
      await this.queue.setGlobalConcurrency(1);
    } catch (error) {
      this.logger.error(
        `Concurrence globale de la file non réglée : ${getErrorMessage(error)}`
      );
    }
  }

  async enqueue({
    planIds,
    collectiviteId,
    userId,
  }: {
    planIds: number[];
    collectiviteId: number;
    userId: string;
  }): Promise<void> {
    if (planIds.length === 0) {
      return;
    }
    try {
      const isEnabled = await this.trackingService.isFeatureEnabled(
        'is-fiche-secteurs-enabled',
        userId,
        collectiviteId
      );
      if (!isEnabled) {
        return;
      }
      for (const planId of planIds) {
        await this.queue.add(COMPLETE_PLAN_SECTEURS_JOB_NAME, {
          planId,
          collectiviteId,
          passage: 1,
        });
      }
    } catch (error) {
      this.logger.error(
        `Rattrapage des secteurs non programmé pour les plans ${planIds.join(
          ', '
        )} : ${getErrorMessage(error)}`
      );
    }
  }

  async enqueueNextPassage(
    data: CompletePlanSecteursJobData,
    delay: number
  ): Promise<Result<void, 'ENQUEUE_NEXT_PASSAGE_ERROR'>> {
    const next = { ...data, passage: data.passage + 1 };
    try {
      await this.queue.add(COMPLETE_PLAN_SECTEURS_JOB_NAME, next, {
        jobId: buildNextPassageJobId(next),
        delay,
      });
      return success(undefined);
    } catch (error) {
      return failure('ENQUEUE_NEXT_PASSAGE_ERROR', error as Error);
    }
  }
}
