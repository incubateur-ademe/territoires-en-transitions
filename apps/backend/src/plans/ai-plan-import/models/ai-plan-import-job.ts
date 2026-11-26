import { PlanStatus } from '@tet/domain/plans';
import { createEnumObject } from '@tet/domain/utils';
import { z } from 'zod';
import { StepStates } from '../pipeline/run-import-pipeline';
import { DisableableField } from './disableable-field';
import { ImportJobStats } from './import-job-stats';
import { AiPlanImportProfile, AiPlanImportProfileEnum } from './import-profile';
import { PlanDraft } from './plan-draft';
import { ImportAbandon, ImportReport } from './import-report';
import type { ImportQuestion, StoredImportQuestion } from './import-question';
import type { ElectrificationImportOptions } from '../electrification/electrification-import-options';

export const aiPlanImportJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
  // Lecture faite, une précision est demandée avant de créer le plan.
  'awaiting_answer',
] as const;

export const AiPlanImportJobStatusEnum = createEnumObject(
  aiPlanImportJobStatusValues
);

export const aiPlanImportJobStatusSchema = z.enum(aiPlanImportJobStatusValues);

export type AiPlanImportJobStatus = z.infer<typeof aiPlanImportJobStatusSchema>;

/** Un import en cours : un seul par collectivité, un seul par utilisateur. */
export const aiPlanImportJobInFlightStatuses: AiPlanImportJobStatus[] = [
  AiPlanImportJobStatusEnum.PENDING,
  AiPlanImportJobStatusEnum.RUNNING,
  AiPlanImportJobStatusEnum.AWAITING_ANSWER,
];

/**
 * Un import qui occupe la file. Celui qui attend une réponse n'y est plus :
 * il ne compte pas dans le plafond global, et un job BullMQ en retard ne le
 * relance pas.
 */
export const aiPlanImportJobProcessingStatuses: AiPlanImportJobStatus[] = [
  AiPlanImportJobStatusEnum.PENDING,
  AiPlanImportJobStatusEnum.RUNNING,
];

/**
 * D'où l'import est lancé, pour le suivi seulement : la page de création d'un
 * plan, la modale du programme d'actions d'une démarche, ou l'étape Documents
 * d'une démarche.
 */
export const aiPlanImportOrigineValues = [
  'page',
  'modale_demarche',
  'etape_documents',
] as const;

export type AiPlanImportOrigine = (typeof aiPlanImportOrigineValues)[number];

type GenericImportOptions = {
  /** Absents sur les jobs historiques, qui restent des imports génériques v1. */
  profile?:
    | typeof AiPlanImportProfileEnum.GENERIC
    | typeof AiPlanImportProfileEnum.PCAET;
  contractVersion?: number;
  catalogueVersion?: null;
  schemaVersion?: never;
  eligibility?: never;
};

export type AiPlanImportJobOptions = {
  instructions: string;
  planName: string;
  planType?: number;
  withVerifications: boolean;
  withSousActions: boolean;
  /** Plan PCAET : l'import propose les secteurs réglementaires des actions. */
  withSecteurs?: boolean;
  disabledFields: DisableableField[];
  /**
   * Suivi seulement, déclarés par le client : ni vérifiés ni utilisés pour
   * autoriser quoi que ce soit. Absents sur les jobs antérieurs.
   */
  origine?: AiPlanImportOrigine;
  demarcheId?: number;
} & (GenericImportOptions | ElectrificationImportOptions);

/** Le compte rendu est durable ; il ne fait pas partie du checkpoint purgé. */
export type AiPlanImportJobDraft = PlanDraft & { report?: ImportReport };

export type AiPlanImportJob = {
  id: string;
  collectiviteId: number;
  createdBy: string;
  status: AiPlanImportJobStatus;
  options: AiPlanImportJobOptions;
  stepStates: StepStates;
  sourcePath: string;
  draft: AiPlanImportJobDraft | null;
  error: string | null;
  createdPlanId: number | null;
  fichierId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  stats: ImportJobStats | null;
  /**
   * Les précisions demandées, et la réponse une fois donnée. Telle qu'en base :
   * se lit par `readImportQuestion`, qui accepte l'ancienne forme.
   */
  question: StoredImportQuestion | null;
  /** Passage en cours : 0 au premier, un de plus à chaque reprise. */
  attempt: number;
  createdAt: string;
  modifiedAt: string;
};

/** Le dernier import d'un fichier, que l'IA a préféré abandonner. */
export type AbandonedAiImport = {
  jobId: string;
  importedAt: string;
  abandon: ImportAbandon;
};

/** Plan encore présent issu d'un import antérieur du même fichier. */
export type PreviousAiImport = {
  planId: number;
  planNom: string | null;
  planStatus: PlanStatus;
  importedAt: string;
};

/** Valeurs du formulaire réutilisables, sans source ni données de traitement. */
export const importRetryDefaultsSchema = z.object({
  planName: z.string(),
  planType: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((value) => value ?? null),
  instructions: z.string(),
  withVerifications: z.boolean(),
  withSousActions: z.boolean(),
});

export type AiPlanImportJobStatusView = {
  id: string;
  collectiviteId: number;
  planName: string | null;
  profile: AiPlanImportProfile | null;
  createdAt: string;
  finishedAt: string | null;
  status: AiPlanImportJobStatus;
  stepStates: StepStates;
  error: string | null;
  createdPlanId: number | null;
  qualitativeReview: string | null;
  report?: ImportReport;
  /** En échec, avec un point de reprise : l'équipe peut le reprendre. */
  resumable: boolean;
  /** Plan PCAET : l'étape des secteurs propose aussi les secteurs réglementaires. */
  withSecteurs: boolean;
  /** Sans sous-actions, les étapes d'une fiche ne sont pas créées. */
  withSousActions: boolean;
  retryDefaults?: z.output<typeof importRetryDefaultsSchema> | null;
  question: ImportQuestion | null;
  /** Le plan créé, compté à la fin : absent des imports antérieurs et d'Électrification. */
  content: ImportContentCounts | null;
};

export type ImportContentCounts = {
  axes: number;
  sousAxes: number;
  actions: number;
  sousActions: number;
};
