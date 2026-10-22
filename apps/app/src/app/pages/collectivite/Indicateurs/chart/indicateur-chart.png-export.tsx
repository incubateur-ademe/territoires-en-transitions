import { downloadElementAsImage } from '@/app/utils/download-element-as-image';
import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import IndicateurChart from './IndicateurChart';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const isDownloading = useRef(false);

  const handleFinished = useCallback(() => {
    if (isDownloading.current || !containerRef.current) return;
    isDownloading.current = true;
    downloadElementAsImage(containerRef.current, title, 'png').finally(onDone);
  }, [title, onDone]);

  return createPortal(
    <div
      ref={containerRef}
      aria-hidden
      className="fixed top-0 -left-[10000px] w-[1000px] p-6 bg-white"
    >
      <IndicateurChart
        chartInfo={chartInfo}
        isLoading={false}
        title={title}
        variant="export"
        onFinished={handleFinished}
      />
    </div>,
    document.body
  );
};
