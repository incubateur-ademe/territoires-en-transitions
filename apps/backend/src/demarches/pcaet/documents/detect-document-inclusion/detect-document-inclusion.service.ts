import { Injectable, Logger } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { detectSourceMimeType } from '@tet/backend/plans/ai-plan-import/enqueue-import/detect-source-mime-type';
import { readDocument } from '@tet/backend/plans/ai-plan-import/pipeline/read-document/read-document';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarcheTypeEnum,
  isDemarchePcaetEtapeModifiable,
} from '@tet/domain/demarches';
import { randomUUID } from 'node:crypto';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
import {
  buildDetectionInput,
  keepDocumentPages,
} from './build-detection-input';
import type { DetectDocumentInclusionJobData } from './detect-document-inclusion.queue';
import {
  INCLUSION_DETECTION_PROMPT,
  INCLUSION_DETECTION_PROMPTS,
} from './detect-document-inclusion.prompts';
import {
  DetectionOutcome,
  DetectionToRun,
  DetectDocumentInclusionRepository,
} from './detect-document-inclusion.repository';
import { detectDocumentInclusionResponseSchema } from './detect-document-inclusion.schema';

const MAX_OUTPUT_TOKENS = 1_000;
const MAX_SECTION_TITLE_LENGTH = 300;
const MAX_JUSTIFICATION_LENGTH = 1_000;
const READ_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * `skipped` : rien à faire, l'analyse a été retirée ou remise à zéro par un
 * nouveau dépôt entre-temps.
 */
export type DetectDocumentInclusionOutcome =
  | 'skipped'
  | 'included'
  | 'not_included'
  | 'failed';

/**
 * Lit un fichier déposé et cherche si une autre pièce du dossier y est
 * comprise (le PLCF dans le diagnostic, par exemple). Une détection positive
 * coche la case de la pièce, si sa place est libre ; une détection négative
 * ou un échec retire les déclarations qui ne tiennent plus.
 */
@Injectable()
export class DetectDocumentInclusionService {
  private readonly logger = new Logger(DetectDocumentInclusionService.name);

  constructor(
    private readonly repository: DetectDocumentInclusionRepository,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly documentStorageService: DocumentStorageService,
    private readonly llm: LlmService,
    private readonly transactionManager: TransactionManager
  ) {}

  async detect({
    detectionId,
    fichierId,
  }: DetectDocumentInclusionJobData): Promise<
    Result<DetectDocumentInclusionOutcome, string>
  > {
    const detection = await this.repository.findById(detectionId);
    if (
      !detection ||
      detection.status !== 'pending' ||
      detection.fichierId !== fichierId
    ) {
      return success('skipped');
    }
    const fichierIdAmont = await this.repository.findFichierIdAmont(detection);
    if (fichierIdAmont !== detection.fichierId) {
      return success('skipped');
    }

    const outcome = await this.analyze(detection);
    return this.record(detection, outcome);
  }

  private async analyze(detection: DetectionToRun): Promise<DetectionOutcome> {
    const model = this.llm.modelFor('light') ?? null;
    const failed = (justification: string): DetectionOutcome => {
      this.logger.warn(
        `Detection ${detection.id} (${detection.documentId} → ${detection.includedDocumentId}) failed: ${justification}`
      );
      return { status: 'failed', justification, model };
    };

    const prompt = INCLUSION_DETECTION_PROMPTS[detection.includedDocumentId];
    if (!prompt) {
      return failed(`aucun prompt pour ${detection.includedDocumentId}`);
    }

    const fichier =
      await this.demarcheDocumentsRepository.findFichierForCollectivite(
        detection.fichierId,
        detection.collectiviteId
      );
    if (!fichier?.bucketId) {
      return failed('fichier introuvable dans la bibliothèque');
    }
    const downloaded = await this.documentStorageService.downloadDocument({
      bucketId: fichier.bucketId,
      key: fichier.hash,
    });
    if (!downloaded.success) {
      return failed('téléchargement impossible');
    }

    const { buffer } = downloaded.data;
    const declaredMimeType = fichier.mimeType ?? downloaded.data.mimeType;
    const read = await readDocument(
      {
        buffer,
        mimeType:
          detectSourceMimeType(buffer, declaredMimeType) ?? declaredMimeType,
      },
      { signal: AbortSignal.timeout(READ_TIMEOUT_MS) }
    );
    if (!read.success) {
      return failed(`lecture impossible (${read.error.kind})`);
    }

    const nonce = randomUUID();
    const input = buildDetectionInput(read.data, prompt.keywords, nonce);
    if (input === null) {
      return {
        status: 'done',
        isIncluded: false,
        parties: [],
        sectionTitle: null,
        pages: [],
        justification: 'Le document ne mentionne jamais le sujet.',
        model: null,
      };
    }

    const definition =
      await this.demarcheDocumentsRepository.findDefinitionInCatalogue(
        DemarcheTypeEnum.PCAET,
        detection.documentId
      );
    const args = {
      tier: 'light' as const,
      systemInstruction: prompt.systemInstruction,
      prompt: generatePrompt(INCLUSION_DETECTION_PROMPT, {
        piece: `${definition?.nom ?? detection.documentId} (fichier « ${
          fichier.filename
        } »)`,
        plan: input.outline || '(aucun titre repéré)',
        extraits: input.excerpts,
      }),
      schema: detectDocumentInclusionResponseSchema,
      temperature: 0,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    };
    let completion = await this.llm.generateStructured(args);
    if (!completion.success && isTransientForDetection(completion.error)) {
      completion = await this.llm.generateStructured(args);
    }
    if (!completion.success) {
      return failed(describeLlmError(completion.error));
    }

    const { isIncluded, parties, sectionTitle, pages, justification } =
      completion.data.data;
    return {
      status: 'done',
      isIncluded,
      parties: isIncluded ? [...new Set(parties)] : [],
      sectionTitle:
        isIncluded && sectionTitle.trim()
          ? sectionTitle.trim().slice(0, MAX_SECTION_TITLE_LENGTH)
          : null,
      pages: isIncluded ? keepDocumentPages(read.data, pages) : [],
      justification: justification.trim().slice(0, MAX_JUSTIFICATION_LENGTH),
      model,
    };
  }

  private async record(
    detection: DetectionToRun,
    outcome: DetectionOutcome
  ): Promise<Result<DetectDocumentInclusionOutcome, string>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DetectDocumentInclusionOutcome, string>> => {
      // Le verrou sérialise l'écriture avec les mutations du dossier, qui
      // passent toutes par la même ligne.
      const ref = await this.refRepository.findRef(
        {
          demarcheId: detection.demarcheId,
          collectiviteId: detection.collectiviteId,
        },
        { forUpdate: true },
        transaction
      );
      if (!ref) {
        return success('skipped');
      }
      const written = await this.repository.complete(
        detection,
        outcome,
        transaction
      );
      if (!written) {
        return success('skipped');
      }

      const isIncluded = outcome.status === 'done' && outcome.isIncluded;
      if (isIncluded && isDemarchePcaetEtapeModifiable(ref.status, 'amont')) {
        const declared = await this.repository.declareInclusion(
          {
            collectiviteId: ref.collectiviteId,
            demarcheId: ref.id,
            documentId: detection.includedDocumentId,
          },
          transaction
        );
        if (declared) {
          this.logger.log(
            `Inclusion of ${detection.includedDocumentId} declared on demarche PCAET ${ref.id}, detected in ${detection.documentId}`
          );
        }
      }
      if (!isIncluded) {
        await this.demarcheDocumentsRepository.pruneInertInclusions(
          ref.id,
          transaction,
          { documentIds: [detection.includedDocumentId] }
        );
      }

      if (outcome.status === 'failed') {
        return success('failed');
      }
      return success(isIncluded ? 'included' : 'not_included');
    };

    const result = await this.transactionManager.executeSingle(
      executeInTransaction
    );
    if (!result.success) {
      return failure(`enregistrement impossible (${result.error})`);
    }
    return result;
  }
}

// Un JSON mal formé ou tronqué varie d'un appel à l'autre ; le reste (quota,
// panne) a déjà été retenté par le service.
const isTransientForDetection = (error: LlmError): boolean =>
  error.kind === 'invalid_json' || error.kind === 'truncated';
