import { createEnumObject } from '@/backend/utils/enum.utils';

export const ReportTemplateSlides = [
  'title_slide',
  'table_of_contents_slide',
  'overview_section_slide',
  'summary_slide',
  'progression_slide',
  'fiche_summary_no_picture_slide',
] as const;

export type ReportTemplateSlidesType = (typeof ReportTemplateSlides)[number];

export const ReportTemplateSlidesEnum = createEnumObject(ReportTemplateSlides);
