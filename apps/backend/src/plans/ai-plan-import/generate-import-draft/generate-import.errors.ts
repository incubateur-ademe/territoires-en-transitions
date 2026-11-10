import {
  type ImportErrors,
  isClientError,
  isImportError,
} from '@tet/backend/plans/plans/import-plan-aggregate/import.errors';
import { getErrorMessage } from '@tet/domain/utils';
import type { ReadDocumentError } from '../pipeline/read-document/read-document';
import {
  describePipelineError,
  type PipelineError,
  type StepName,
} from '../pipeline/run-import-pipeline';
import type { GenerateImportDraftError } from './generate-import-draft.service';

const WRONG_TOME_LABELS = {
  evaluation_environnementale:
    'une évaluation environnementale stratégique (EES)',
  diagnostic: 'un diagnostic',
} satisfies Record<
  Extract<PipelineError, { kind: 'wrong_document_tome' }>['tome'],
  string
>;

/** Messages des échecs conservés dans le job et affichés à l'utilisateur. */
export class ImportGenerationErrors {
  static fromDocument(error: ReadDocumentError): string {
    switch (error.kind) {
      case 'unsupported_mime':
        return `Type de fichier non supporté (${error.mimeType})`;
      case 'empty_text':
        return 'Document vide ou probablement scanné (aucun texte extractible)';
      case 'parse_failed':
        return 'Lecture du document impossible';
      case 'timeout':
        return 'Lecture du document trop longue';
      case 'scanned_too_long':
        return `Document scanné de ${error.scannedPages} pages : l'import en lit au plus ${error.maxOcrPages}, exportez le programme d'actions seul`;
      case 'ocr_failed':
        return `Lecture des pages scannées impossible (${
          error.failedPages.length
        } page(s) en échec : ${error.reasons.join(', ')})`;
    }
  }

  static fromPipeline(failedStep: StepName, error: PipelineError): string {
    switch (error.kind) {
      case 'document_too_long':
        return `Document trop long pour l'import (${error.chunks} parties à analyser, ${error.maxChunks} au maximum) : importez-le en plusieurs fois`;
      case 'wrong_document_tome':
        return `Ce document semble être ${WRONG_TOME_LABELS[error.tome]} (« ${
          error.evidence
        } »), pas un programme d'actions : déposez le document qui contient les actions`;
      default:
        return `Étape ${failedStep} en échec (${describePipelineError(error)})`;
    }
  }

  static planCreation(error: ImportErrors | null): string {
    return `Création du plan impossible : ${
      error === null
        ? 'erreur inattendue'
        : isImportError(error) && !isClientError(error)
        ? error._tag
        : error.message ?? String(error)
    }`;
  }

  static interrupted(error: unknown): string {
    return `Import interrompu: ${getErrorMessage(error)}`;
  }

  static forWorker(error: GenerateImportDraftError): string {
    switch (error.kind) {
      case 'transition_failed':
        return `Transition du job ${error.jobId} impossible (${error.cause})`;
      case 'failure_record_failed':
        return `Enregistrement de l'échec du job ${error.jobId} impossible (${error.cause})`;
      case 'interrupted':
        return error.message;
    }
  }
}
