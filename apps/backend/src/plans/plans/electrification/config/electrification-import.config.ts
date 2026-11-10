import type { StepStates } from '@tet/backend/plans/ai-plan-import/pipeline/pipeline-step-states';
import { ELECTRIFICATION_SOURCE_ID } from '@tet/domain/indicateurs';

/** Étapes réellement exécutées, dès l'admission et à chaque reprise. */
export const electrificationImportStepStates = {
  reading: 'pending',
  extraction: 'pending',
  scouting: 'skipped',
  hierarchy: 'skipped',
  scoring: 'skipped',
  consolidation: 'skipped',
  enrichment: 'skipped',
  secteurs: 'skipped',
  qualitativeReview: 'skipped',
} as const satisfies StepStates;

export const electrificationIndicateurSource = {
  id: ELECTRIFICATION_SOURCE_ID,
  libelle: '100 territoires d’électrification',
};

export const electrificationIndicateurMetadonnee = {
  nomDonnees: 'Engagement pris dans votre convention',
};
