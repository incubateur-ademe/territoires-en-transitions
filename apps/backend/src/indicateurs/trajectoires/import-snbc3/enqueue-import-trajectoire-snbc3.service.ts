import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { ImportTrajectoireSnbc3Error } from './import-trajectoire-snbc3.errors';
import {
  ImportTrajectoireSnbc3Enqueued,
  ImportTrajectoireSnbc3Input,
} from './import-trajectoire-snbc3.input';
import {
  IMPORT_TRAJECTOIRE_SNBC3_JOB_ID,
  IMPORT_TRAJECTOIRE_SNBC3_JOB_NAME,
  IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME,
  ImportTrajectoireSnbc3JobData,
} from './import-trajectoire-snbc3.queue';
import { Snbc3ReleaseStorageService } from './snbc3-release-storage.service';

/**
 * Met l'import en file : il dure plusieurs minutes, au-delà du délai HTTP.
 * Les refus qui ne demandent pas de lire la release sont renvoyés tout de
 * suite ; le worker les vérifie de nouveau.
 */
@Injectable()
export class EnqueueImportTrajectoireSnbc3Service implements OnModuleInit {
  private readonly logger = new Logger(
    EnqueueImportTrajectoireSnbc3Service.name
  );

  constructor(
    @InjectQueue(IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME)
    private readonly queue: Queue<ImportTrajectoireSnbc3JobData>,
    private readonly storage: Snbc3ReleaseStorageService
  ) {}

  /** Un import à la fois, toutes instances confondues. */
  async onModuleInit() {
    try {
      await this.queue.setGlobalConcurrency(1);
    } catch (error) {
      this.logger.error(
        `Concurrence globale de la file non réglée : ${getErrorMessage(error)}`
      );
    }
  }

  async enqueue(
    input: ImportTrajectoireSnbc3Input
  ): Promise<
    Result<ImportTrajectoireSnbc3Enqueued, ImportTrajectoireSnbc3Error>
  > {
    try {
      const pending = await this.queue.getJobCounts(
        'active',
        'waiting',
        'delayed',
        'prioritized'
      );
      if (Object.values(pending).some((count) => count > 0)) {
        this.logger.warn('Import SNBC 3 déjà en cours ou en attente');
        return failure('SNBC3_IMPORT_ALREADY_RUNNING');
      }

      if (input.collectiviteIds) {
        const imported = await this.storage.getImportedRelease();
        if (
          !imported ||
          !imported.commit.startsWith(input.commit) ||
          imported.version !== input.version
        ) {
          this.logger.warn(
            `Rejeu partiel refusé : la release ${input.version}@${
              input.commit
            } n'est pas la dernière importée (${
              imported ? `${imported.version}@${imported.commit}` : 'aucune'
            })`
          );
          return failure('SNBC3_PARTIAL_IMPORT_RELEASE_MISMATCH');
        }
      }

      // L'id fixe garantit un seul job, même entre deux appels simultanés :
      // BullMQ ignore l'ajout d'un job dont l'id existe déjà. Le job terminé
      // du dernier import (gardé pour son rapport) est donc retiré d'abord.
      const previous = await this.queue.getJob(IMPORT_TRAJECTOIRE_SNBC3_JOB_ID);
      if (previous) {
        const state = await previous.getState();
        if (!['completed', 'failed', 'unknown'].includes(state)) {
          this.logger.warn(`Import SNBC 3 déjà en cours (job ${state})`);
          return failure('SNBC3_IMPORT_ALREADY_RUNNING');
        }
        await this.queue.remove(IMPORT_TRAJECTOIRE_SNBC3_JOB_ID);
      }

      const job = await this.queue.add(
        IMPORT_TRAJECTOIRE_SNBC3_JOB_NAME,
        input,
        {
          jobId: IMPORT_TRAJECTOIRE_SNBC3_JOB_ID,
        }
      );
      if (job.id === undefined) {
        return failure(
          'SERVER_ERROR',
          new Error('BullMQ n’a pas attribué d’id au job d’import SNBC 3')
        );
      }
      // `add` renvoie notre job même s'il a été ignoré : le job en file est
      // celui d'un appel concurrent si son horodatage ou ses données diffèrent.
      const queued = await this.queue.getJob(job.id);
      if (
        !queued ||
        queued.timestamp !== job.timestamp ||
        JSON.stringify(queued.data) !== JSON.stringify(job.data)
      ) {
        this.logger.warn('Import SNBC 3 mis en file par un appel concurrent');
        return failure('SNBC3_IMPORT_ALREADY_RUNNING');
      }
      this.logger.log(
        `Import SNBC 3 en file (job ${job.id}) : release ${input.version} du commit ${input.commit}`
      );
      return success({ jobId: job.id });
    } catch (error) {
      return failure(
        'SERVER_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
