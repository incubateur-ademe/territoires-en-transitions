import { appLabels } from '@/app/labels/catalog';
import {
  AiPlanImportProfileEnum,
  type AiPlanImportProfile,
  type PlanType,
} from '@tet/domain/plans';
import {
  electrificationImportConfig,
  isElectrificationPlanType,
} from './electrification/electrification-import.config';

export type AiImportFormConfig = {
  profile: AiPlanImportProfile;
  fileExtensions: readonly string[];
  fileHint: string;
  formatError: string;
  description: string;
  /** Absentes : l'utilisateur choisit ces options dans le formulaire. */
  fixedExtractionOptions?: {
    instructions: string;
    withVerifications: boolean;
    withSousActions: boolean;
  };
};

export const genericImportConfig: AiImportFormConfig = {
  profile: AiPlanImportProfileEnum.GENERIC,
  fileExtensions: ['.pdf', '.docx', '.csv', '.xlsx'],
  fileHint: appLabels.importPlanIaFormatsAcceptes,
  formatError: appLabels.importPlanIaFormatNonSupporte,
  description: appLabels.importPlanIaDescription,
};

/** La sélection du type choisit aussi son contrat documentaire, sans repli. */
export const getAiImportFormConfig = (
  planType?: PlanType
): AiImportFormConfig =>
  isElectrificationPlanType(planType)
    ? electrificationImportConfig
    : genericImportConfig;
