import { ReportTemplateSlidesType } from './report-template-slides.enum';
import { ReportTemplatesType } from './report-templates.enum';

export interface ReportTemplateConfig {
  key: ReportTemplatesType;
  templatePath: string;
  title: string;
  default: boolean;
  description?: string;
  slides: Record<ReportTemplateSlidesType, number>;
}
