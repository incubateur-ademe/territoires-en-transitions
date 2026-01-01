import {
  IndicateurChartSegmentation,
  IndicateurChartSourceFilter,
} from '@tet/backend/indicateurs/charts/indicateur-chart.input';
import { ReportTemplateImagesType } from './report-template-images.enum';
import { ReportTemplateSlidesType } from './report-template-slides.enum';

export interface IndicateurTerritorialSlideConfiguration {
  identifiantReferentiel: string;
  sources?: IndicateurChartSourceFilter;
  segmentation?: IndicateurChartSegmentation;
  imageId: ReportTemplateImagesType;
  slideId: ReportTemplateSlidesType;
}
