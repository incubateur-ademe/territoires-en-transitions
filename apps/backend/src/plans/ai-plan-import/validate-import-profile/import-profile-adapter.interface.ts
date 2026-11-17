import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import type { Result } from '@tet/backend/utils/result.type';
import type { AiPlanImportProfile, PlanType } from '@tet/domain/plans';
import type { AiPlanImportError } from '../ai-plan-import.errors';
import type { StoredImportCheckpoint } from '../models/import-checkpoint';
import type {
  ImportAdmission,
  ImportAdmissionInput,
} from './import-admission.types';

export const IMPORT_PROFILE_ADAPTERS = Symbol('IMPORT_PROFILE_ADAPTERS');

/** Chaque profil porte ses règles d'admission et de reprise. */
export interface ImportProfileAdapter {
  readonly profile: AiPlanImportProfile;
  /** Refus préalable si ce type impose son propre parcours d'import. */
  readonly profileMismatchError?: AiPlanImportError;

  appliesTo(planType: PlanType): boolean;
  checkAvailability(
    input: { collectiviteId: number },
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>>;
  authorizeAdmission(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<ImportAdmission, AiPlanImportError>>;
  validateSource(mimeType: string): Result<void, AiPlanImportError>;

  // Les jobs déjà admis restent indépendants de l'ouverture des nouveaux imports.
  isSupportedImport(options: unknown): boolean;
  parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<StoredImportCheckpoint, AiPlanImportError>;
  authorizeExistingImport(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>>;
}

export type ImportProfileAdapters = Readonly<
  Record<AiPlanImportProfile, ImportProfileAdapter>
>;
