import type { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import type { ExtractedAction } from '../models/extracted-action';
import type { PlanSkeleton } from '../models/plan-skeleton';
import type { DocumentKind } from './document/document-page';
import type {
  PipelineLlm,
  StepName,
  StepStates,
} from './run-import-pipeline';
import type { DocumentUnit } from './segment-document/document-unit';
import type { SourceChunks } from './source-chunks/source-chunks';

export type PipelineProgress = {
  actions: ExtractedAction[];
  review: string | null;
  tokens: TokenUsage;
  stepStates: StepStates;
  warnings: string[];
};

/** Ce que les étapes se transmettent, actions comprises. */
export type PipelineState = {
  progress: PipelineProgress;
  chunks: string[];
  units: DocumentUnit[] | null;
  skeleton: PlanSkeleton | null;
  source: SourceChunks;
};

export const PIPELINE_CHECKPOINT_SCHEMA_VERSION = 1;

/**
 * L'état de la pipeline après sa dernière étape terminée : de quoi la reprendre
 * là sans rappeler le modèle pour ce qui est fait. JSON pur, gardé sur le job.
 */
export type PipelineCheckpoint = PipelineState & {
  schemaVersion: typeof PIPELINE_CHECKPOINT_SCHEMA_VERSION;
  completedStep: StepName;
  /** Date passée aux prompts : une reprise garde celle du premier passage. */
  currentDate: string;
  /** Absent des points de reprise enregistrés avant son ajout. */
  documentKind?: DocumentKind;
  /** Le texte est découpé pour ce modèle : un autre ne le reprend pas. */
  llm: {
    strategy: PipelineLlm['capabilities']['strategy'];
    maxInputTokens: number;
  };
};
