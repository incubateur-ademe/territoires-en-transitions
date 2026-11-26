import {
  type ImportErrors,
  isClientError,
  isImportError,
} from '@tet/backend/plans/plans/import-plan-aggregate/import.errors';
import { getErrorMessage } from '@tet/domain/utils';
import type {
  AnalysisAbandonedError,
  ModelDoubtMotif,
} from '../models/model-doubt';
import type { ImportReport } from '../models/import-report';
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

const ABANDON_LABELS = {
  'aucune-action': {
    problem:
      "L'IA n'a trouvé aucune action dans ce document et préfère s'arrêter plutôt que d'en inventer.",
    advice:
      "Déposez le document qui contient le plan d'actions (fiches actions ou tableau des actions) ou, si c'est bien celui-ci, contactez-nous.",
  },
  'texte-illisible': {
    problem:
      "L'IA ne parvient pas à lire assez de texte dans ce document et préfère s'arrêter plutôt que de deviner.",
    advice:
      "Déposez une version dont le texte se sélectionne (un PDF exporté depuis le traitement de texte plutôt qu'un scan) ou, à défaut, contactez-nous.",
  },
  'plusieurs-plans': {
    problem:
      "Ce document semble réunir plusieurs plans d'actions distincts : l'IA préfère s'arrêter plutôt que de les mélanger en un seul plan.",
    advice:
      'Importez chaque plan séparément, dans un fichier qui ne contient que ses pages.',
  },
  'grilles-concurrentes': {
    problem:
      "Ce document range ses actions selon plusieurs découpages en axes, sans dire lequel est celui du plan : l'IA préfère s'arrêter plutôt que d'en choisir un au hasard.",
    advice:
      'Déposez une version qui ne garde que le découpage du plan (par exemple sans le tableau de correspondance) ou contactez-nous.',
  },
} satisfies Record<ModelDoubtMotif, { problem: string; advice: string }>;

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
      case 'analysis_abandoned':
        return ImportGenerationErrors.abandoned(error);
      default:
        return `Étape ${failedStep} en échec (${describePipelineError(error)})`;
    }
  }

  /**
   * Le problème, les passages qui le montrent, les mots du modèle donnés
   * pour tels, puis quoi faire : composé ici, jamais laissé au modèle.
   */
  static abandoned({
    motif,
    evidence,
    explanation,
    readingStats,
  }: AnalysisAbandonedError): string {
    const { problem, advice } = ABANDON_LABELS[motif];
    return [
      readingStats
        ? `${problem} ${readingStats.unreadablePages} pages sur ${readingStats.pageCount} n'ont pas de texte exploitable.`
        : problem,
      `Ce qu'elle a relevé : ${evidence
        .map(({ citation, page }) => `« ${citation} » (p. ${page})`)
        .join(', ')}.`,
      ...(explanation ? [`Elle précise : « ${explanation} »`] : []),
      advice,
    ].join('\n');
  }

  /** Une remarque par passage cité, à sa page, et l'abandon pour l'écran. */
  static abandonReport({
    motif,
    evidence,
    explanation,
    readingStats,
  }: AnalysisAbandonedError): ImportReport {
    return {
      issues: evidence.map(({ citation, page }) => ({
        kind: 'document-error',
        code: `abandon:${motif}`,
        message: `Passage relevé par l'IA : « ${citation} »`,
        location: `p. ${page}`,
      })),
      qualitativeReview: null,
      abandon: {
        motif,
        evidence,
        explanation,
        ...(readingStats ? { readingStats } : {}),
      },
    };
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
