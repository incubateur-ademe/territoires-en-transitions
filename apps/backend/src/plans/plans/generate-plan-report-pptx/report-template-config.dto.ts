import { ReportTemplatesType } from '@tet/domain/plans';
import { ReportTemplateSlidesType } from './report-template-slides.enum';

export interface ReportTemplateConfig {
  key: ReportTemplatesType;
  templatePath: string;
  title: string;
  default: boolean;
  description?: string;
  slides: Record<ReportTemplateSlidesType, number>;
  max_fiche_indicateurs_per_slide: number;
}
