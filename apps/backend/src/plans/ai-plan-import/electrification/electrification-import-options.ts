import type { ElectrificationEligibilityDecision } from '../../plans/check-electrification-eligibility/check-electrification-eligibility.service';
import { AiPlanImportProfileEnum } from '../models/import-profile';

/** Métadonnées serveur conservées avec le job Électrification. */
export type ElectrificationImportOptions = {
  profile: typeof AiPlanImportProfileEnum.ELECTRIFICATION;
  schemaVersion?: number;
  catalogueVersion?: string | null;
  templateVersion?: string;
  contractVersion?: never;
  /** Décision d'admission et provenance du mapping des lauréats. */
  eligibility?: ElectrificationEligibilityDecision;
};
