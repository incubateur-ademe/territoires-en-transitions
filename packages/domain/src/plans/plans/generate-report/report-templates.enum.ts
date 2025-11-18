import { createEnumObject } from '@tet/domain/utils';

export const ReportTemplates = ['general_bilan_template'] as const;

export const ReportTemplatesEnum = createEnumObject(ReportTemplates);

export type ReportTemplatesType = (typeof ReportTemplates)[number];
