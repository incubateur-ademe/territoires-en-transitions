import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { IndicateurSourcesSelect } from './indicateur-sources.select';
import { TypeSegmentationSelect } from './type-segmentation.select';

export const IndicateurDonneesSelects = () => {
  const { chartInfo } = useIndicateurChart();
  const { sourceFilter, typesSegmentation } = chartInfo;

  return (
    <>
      {sourceFilter.availableOptions.length > 1 && (
        <IndicateurSourcesSelect sourceFilter={sourceFilter} />
      )}

      {typesSegmentation?.length > 1 && (
        <TypeSegmentationSelect chartInfo={chartInfo} />
      )}
    </>
  );
};
