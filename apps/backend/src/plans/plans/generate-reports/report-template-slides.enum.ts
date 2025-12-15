import { createEnumObject } from '@tet/domain/utils';

export const ReportTemplateSlides = [
  'title_slide',
  'table_of_contents_slide',
  'overview_section_slide',
  'summary_slide',
  'progression_slide',
  'axes_section_slide',
  'axe_summary_slide',
  'fiche_summary_no_picture_slide',
  'fiche_indicateurs_slide',
] as const;

export type ReportTemplateSlidesType = (typeof ReportTemplateSlides)[number];

export const ReportTemplateSlidesEnum = createEnumObject(ReportTemplateSlides);
