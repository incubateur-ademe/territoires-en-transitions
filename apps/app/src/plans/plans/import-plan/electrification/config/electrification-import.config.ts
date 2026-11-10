import { appLabels } from '@/app/labels/catalog';
import {
  AiPlanImportProfileEnum,
  ELECTRIFICATION_PLAN_TYPE_KEY,
  type PlanType,
} from '@tet/domain/plans';
import type { AiImportFormConfig } from '../../ai-import-form.config';

export const electrificationImportConfig = {
  profile: AiPlanImportProfileEnum.ELECTRIFICATION,
  fileExtensions: ['.docx'],
  fileHint: appLabels.importElectrificationFormat,
  formatError: appLabels.importElectrificationFormatErreur,
  description: appLabels.importElectrificationDescription,
  fixedExtractionOptions: {
    instructions: '',
    withVerifications: false,
    withSousActions: true,
  },
} satisfies AiImportFormConfig;

export const isElectrificationPlanType = (planType?: PlanType) =>
  planType?.categorie === ELECTRIFICATION_PLAN_TYPE_KEY.categorie &&
  planType.type === ELECTRIFICATION_PLAN_TYPE_KEY.type;
