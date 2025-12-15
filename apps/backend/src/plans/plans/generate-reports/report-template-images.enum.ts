import { createEnumObject } from '@tet/domain/utils';

export const ReportTemplateImages = [
  'img_collectivite_logo',
  'img_plan_count_by_statut_pie',
  'img_plan_progress_by_axe_chart',
  'img_axe_count_by_statut_pie',
  'img_fiche_indicateur_chart_1',
  'img_fiche_indicateur_chart_2',
] as const;

export type ReportTemplateImagesType = (typeof ReportTemplateImages)[number];

export const ReportTemplateImagesEnum = createEnumObject(ReportTemplateImages);
