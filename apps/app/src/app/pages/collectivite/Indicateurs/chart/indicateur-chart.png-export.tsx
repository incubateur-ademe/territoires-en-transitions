import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { ChartPngExportFrame } from './chart-png-export.frame';
import IndicateurChart from './IndicateurChart';
import { useChartPngExport } from './use-chart-png-export';

type Props = {
  chartInfo: IndicateurChartInfo;
  title: string;
  onDone: () => void;
};

export const IndicateurChartPngExport = ({
  chartInfo,
  title,
  onDone,
}: Props) => {
  const { containerRef, onFinished } = useChartPngExport({ title, onDone });

  return (
    <ChartPngExportFrame containerRef={containerRef}>
      <IndicateurChart
        chartInfo={chartInfo}
        isLoading={false}
        title={title}
        variant="export"
        onFinished={onFinished}
      />
    </ChartPngExportFrame>
  );
};
