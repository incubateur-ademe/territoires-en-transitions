import Automizer, { ISlide } from 'pptx-automizer/dist';
import { ReportPlanGeneralInfo } from './report-plan-general-info.dto';
import { ReportTemplateConfig } from './report-template-config.dto';
import { ReportTemplateSlidesType } from './report-template-slides.enum';

export interface SlideGenerationArgs {
  presentation: Automizer;
  planGeneralInfo: ReportPlanGeneralInfo;
  template: ReportTemplateConfig;
  slideType: ReportTemplateSlidesType;
  logo: {
    dimensions: { width: number; height: number };
    fileName: string;
  } | null;
  callback?: (slide: ISlide) => Promise<void>;
  extraTextReplacements?: any;
}
