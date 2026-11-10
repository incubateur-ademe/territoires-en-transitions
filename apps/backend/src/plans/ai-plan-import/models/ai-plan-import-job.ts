import { PlanStatus } from '@tet/domain/plans';
import { createEnumObject } from '@tet/domain/utils';
import { z } from 'zod';
import { StepStates } from '../pipeline/run-import-pipeline';
import { DisableableField } from './disableable-field';
import { ImportJobStats } from './import-job-stats';
import { AiPlanImportProfile } from './import-profile';
import { PlanDraft } from './plan-draft';

export const aiPlanImportJobStatusValues = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

export const AiPlanImportJobStatusEnum = createEnumObject(
  aiPlanImportJobStatusValues
);

export const aiPlanImportJobStatusSchema = z.enum(aiPlanImportJobStatusValues);

export type AiPlanImportJobStatus = z.infer<typeof aiPlanImportJobStatusSchema>;

export const aiPlanImportJobInFlightStatuses: AiPlanImportJobStatus[] = [
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

export type AiPlanImportJobOptions = {
  /** Absents sur les jobs historiques, qui restent des imports génériques v1. */
  profile?: AiPlanImportProfile;
  contractVersion?: number;
  catalogueVersion?: string | null;
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
};

export type AiPlanImportJob = {
  id: string;
  collectiviteId: number;
  createdBy: string;
  status: AiPlanImportJobStatus;
  options: AiPlanImportJobOptions;
  stepStates: StepStates;
  sourcePath: string;
  draft: PlanDraft | null;
  error: string | null;
  createdPlanId: number | null;
  fichierId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  stats: ImportJobStats | null;
  /** Passage en cours : 0 au premier, un de plus à chaque reprise. */
  attempt: number;
  createdAt: string;
  modifiedAt: string;
};

/** Plan encore présent issu d'un import antérieur du même fichier. */
export type PreviousAiImport = {
  planId: number;
  planNom: string | null;
  planStatus: PlanStatus;
  importedAt: string;
};

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
  /** En échec, avec un point de reprise : l'équipe peut le reprendre. */
  resumable: boolean;
  /** Plan PCAET : l'étape des secteurs propose aussi les secteurs réglementaires. */
  withSecteurs: boolean;
};
