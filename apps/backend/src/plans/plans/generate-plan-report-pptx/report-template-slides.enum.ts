import { createEnumObject } from '@tet/domain/utils';

export const ReportTemplateSlides = [
  'title_slide',
  'table_of_contents_slide',
  'overview_section_slide',
  'summary_slide',
  'progression_slide',
  'donnees_territoriales_section_slide',
  'emissions_ges_slide',
  'consommations_finales_slide',
  'production_renouvelable_slide',
  'axes_section_slide',
  'axe_summary_slide',
  'fiche_summary_slide',
  'fiche_indicateurs_slide',
  'ressources_slide',
] as const;

export type ReportTemplateSlidesType = (typeof ReportTemplateSlides)[number];

export const ReportTemplateSlidesEnum = createEnumObject(ReportTemplateSlides);
