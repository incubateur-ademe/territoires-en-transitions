import { ReportTemplatesType } from '../../../../../../packages/domain/src/plans/plans/generate-report/report-templates.enum';
import { ReportTemplateSlidesType } from './report-template-slides.enum';

export interface ReportTemplateConfig {
  key: ReportTemplatesType;
  templatePath: string;
  title: string;
  default: boolean;
  description?: string;
  slides: Record<ReportTemplateSlidesType, number>;
}
