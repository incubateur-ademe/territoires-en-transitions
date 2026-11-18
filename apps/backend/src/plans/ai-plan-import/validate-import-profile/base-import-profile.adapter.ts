import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { success, type Result } from '@tet/backend/utils/result.type';
import type { AiPlanImportProfile, PlanType } from '@tet/domain/plans';
import type { AiPlanImportError } from '../ai-plan-import.errors';
import type { StoredImportCheckpoint } from '../models/import-checkpoint';
import type {
  ImportAdmission,
  ImportAdmissionInput,
} from './import-admission.types';
import type { ImportProfileAdapter } from './import-profile-adapter.interface';

/**
 * Contrat par défaut d'un profil : disponible, toute source admise, reprise
 * libre des jobs déjà admis. Chaque profil ne redéfinit que les règles qui lui
 * sont propres, sans réécrire les comportements communs.
 */
export abstract class BaseImportProfileAdapter implements ImportProfileAdapter {
  abstract readonly profile: AiPlanImportProfile;
  /** Refus préalable si ce type impose son propre parcours d'import. */
  readonly profileMismatchError?: AiPlanImportError;

  abstract appliesTo(planType: PlanType): boolean;
  abstract authorizeAdmission(
    input: ImportAdmissionInput,
    context: ServiceSecondArg
  ): Promise<Result<ImportAdmission, AiPlanImportError>>;
  abstract isSupportedImport(options: unknown): boolean;
  abstract parseCheckpoint(
    checkpoint: unknown,
    options: unknown
  ): Result<StoredImportCheckpoint, AiPlanImportError>;

  /** Aucun prérequis en plus du contrôle d'accès commun. */
  async checkAvailability(
    _input: { collectiviteId: number },
    _context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    return success(undefined);
  }

  /** Tout type de source est accepté par défaut. */
  validateSource(_mimeType: string): Result<void, AiPlanImportError> {
    return success(undefined);
  }

  /** Un job déjà admis reste indépendant de l'ouverture des nouveaux imports. */
  async authorizeExistingImport(
    _input: ImportAdmissionInput,
    _context: ServiceSecondArg
  ): Promise<Result<void, AiPlanImportError>> {
    return success(undefined);
  }
}
