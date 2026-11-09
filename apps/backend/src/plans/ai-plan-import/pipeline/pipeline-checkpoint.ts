import {
  type TokenUsage,
  tokenUsageSchema,
} from '@tet/backend/utils/llm/token-usage';
import { z } from 'zod';
import {
  extractedActionSchema,
  type ExtractedAction,
} from '../models/extracted-action';
import {
  AiPlanImportProfileEnum,
  GENERIC_IMPORT_CONTRACT_VERSION,
} from '../models/import-profile';
import { planSkeletonSchema, type PlanSkeleton } from '../models/plan-skeleton';
import type { DocumentKind } from './document/document-page';
import type { PipelineLlm } from './run-import-pipeline';
import {
  stepStatesSchema,
  type StepName,
  type StepStates,
} from './pipeline-step-states';
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
  /** Absents des jobs génériques déjà en cours lors de l'ajout des profils. */
  profile?: typeof AiPlanImportProfileEnum.GENERIC;
  contractVersion?: typeof GENERIC_IMPORT_CONTRACT_VERSION;
  catalogueVersion?: null;
  schemaVersion: typeof PIPELINE_CHECKPOINT_SCHEMA_VERSION;
  completedStep: StepName;
  /** Date passée aux prompts : une reprise garde celle du premier passage. */
  currentDate: string;
  /** Absent des points de reprise enregistrés avant son ajout. */
  documentKind?: DocumentKind;
  /**
   * Un tableur dont les fiches s'étendent sur plusieurs rangées fusionnées :
   * ses titres repris se dédoublonnent. Absent des points de reprise
   * antérieurs, où chaque rangée reste une fiche.
   */
  tabularRowGroups?: boolean;
  /** Le texte est découpé pour ce modèle : un autre ne le reprend pas. */
  llm: {
    strategy: PipelineLlm['capabilities']['strategy'];
    maxInputTokens: number;
  };
};

/** Seul le contrat générique est exécutable ; aucun format annexe implicite. */
export const genericImportContractSchema = z.object({
  profile: z.literal(AiPlanImportProfileEnum.GENERIC).optional(),
  contractVersion: z.literal(GENERIC_IMPORT_CONTRACT_VERSION).optional(),
  catalogueVersion: z.null().optional(),
});

const countSchema = z.number().int().nonnegative();

export const documentKindSchema = z.enum(['pdf', 'docx', 'xlsx', 'csv']);

const documentUnitSchema = z.object({
  id: z.string(),
  lines: z.array(z.object({ text: z.string(), pageIndex: countSchema })),
  text: z.string(),
  pageStart: countSchema,
  pageEnd: countSchema,
  headingPath: z.array(z.string()),
  section: z.string().optional(),
  title: z.string().optional(),
  kind: z.enum(['fiche', 'section', 'table', 'unknown']),
  tokenEstimate: countSchema,
  continued: z.boolean().optional(),
});

export const pipelineCheckpointSchema = genericImportContractSchema.extend({
  schemaVersion: z.literal(PIPELINE_CHECKPOINT_SCHEMA_VERSION),
  completedStep: stepStatesSchema.keyof(),
  currentDate: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value))),
  documentKind: documentKindSchema.optional(),
  tabularRowGroups: z.boolean().optional(),
  llm: z.object({
    strategy: z.enum(['whole-document', 'segmented']),
    maxInputTokens: z.number().int().positive(),
  }),
  progress: z.object({
    actions: z.array(extractedActionSchema),
    review: z.string().nullable(),
    tokens: tokenUsageSchema,
    stepStates: stepStatesSchema,
    warnings: z.array(z.string()),
  }),
  chunks: z.array(z.string()),
  units: z.array(documentUnitSchema).nullable(),
  skeleton: planSkeletonSchema.nullable(),
  source: z.object({
    chunks: z.array(z.string()),
    chunkIndexByAction: z.array(countSchema),
  }),
}) satisfies z.ZodType<PipelineCheckpoint>;
