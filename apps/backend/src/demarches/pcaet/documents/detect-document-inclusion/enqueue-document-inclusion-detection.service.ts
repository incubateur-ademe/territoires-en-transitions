import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { DemarcheDocumentDefinition } from '@tet/domain/demarches';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import {
  DETECT_DOCUMENT_INCLUSION_JOB_NAME,
  DETECT_DOCUMENT_INCLUSION_JOB_OPTIONS,
  DETECT_DOCUMENT_INCLUSION_QUEUE_NAME,
  type DetectDocumentInclusionJobData,
} from './detect-document-inclusion.queue';
import { DetectDocumentInclusionRepository } from './detect-document-inclusion.repository';

export type PendingDetection = { id: number; fichierId: number };

/**
 * Déclenche l'analyse d'un fichier déposé, pour chaque pièce du catalogue qui
 * peut y être trouvée. Le catalogue reçu est celui de la collectivité : une
 * pièce qui ne la concerne pas (le PLCF d'un EPCI non assujetti) n'est jamais
 * cherchée.
 */
@Injectable()
export class EnqueueDocumentInclusionDetectionService {
  private readonly logger = new Logger(
    EnqueueDocumentInclusionDetectionService.name
  );

  constructor(
    private readonly repository: DetectDocumentInclusionRepository,
    @InjectQueue(DETECT_DOCUMENT_INCLUSION_QUEUE_NAME)
    private readonly queue: Queue<DetectDocumentInclusionJobData>
  ) {}

  /** Dans la transaction du dépôt : l'analyse naît avec le fichier. */
  async markPending(
    {
      demarcheId,
      documentId,
      fichierId,
      definitions,
    }: {
      demarcheId: number;
      documentId: string;
      fichierId: number;
      definitions: readonly DemarcheDocumentDefinition[];
    },
    tx: Transaction
  ): Promise<PendingDetection[]> {
    const includedDocumentIds = definitions
      .filter(({ substitutsDetectes }) =>
        substitutsDetectes.includes(documentId)
      )
      .map(({ id }) => id);
    return this.repository.resetPending(
      { demarcheId, documentId, fichierId, includedDocumentIds },
      tx
    );
  }

  /**
   * Après le commit : un job lancé plus tôt pourrait lire une analyse qui
   * n'existe pas encore. Un job qui ne part pas passe l'analyse en échec, sans
   * quoi l'écran l'attendrait indéfiniment.
   */
  async enqueue(detections: readonly PendingDetection[]): Promise<void> {
    for (const detection of detections) {
      try {
        await this.queue.add(
          DETECT_DOCUMENT_INCLUSION_JOB_NAME,
          { detectionId: detection.id, fichierId: detection.fichierId },
          DETECT_DOCUMENT_INCLUSION_JOB_OPTIONS
        );
      } catch (error) {
        this.logger.error(
          `Detection ${detection.id} could not be enqueued: ${getErrorMessage(
            error
          )}`
        );
        await this.repository.markFailed(
          detection,
          "Analyse non lancée : file d'attente indisponible"
        );
      }
    }
  }
}
