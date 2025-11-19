import { createEnumObject } from '@/backend/utils/enum.utils';

export const ReportTemplateImages = [
  'img_collectivite_logo',
  'img_plan_count_by_statut_pie',
  'img_plan_progress_by_axe_chart',
] as const;

export type ReportTemplateImagesType = (typeof ReportTemplateImages)[number];

export const ReportTemplateImagesEnum = createEnumObject(ReportTemplateImages);
