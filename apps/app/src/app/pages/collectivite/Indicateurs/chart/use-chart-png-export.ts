import { downloadElementAsImage } from '@/app/utils/download-element-as-image';
import { type RefObject, useCallback, useRef } from 'react';

type ChartPngExport = {
  containerRef: RefObject<HTMLDivElement | null>;
  onFinished: () => void;
};

export const useChartPngExport = ({
  title,
  onDone,
}: {
  title: string;
  onDone: () => void;
}): ChartPngExport => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDownloading = useRef(false);

  const onFinished = useCallback(() => {
    if (isDownloading.current || !containerRef.current) return;
    isDownloading.current = true;
    downloadElementAsImage(containerRef.current, title, 'png').finally(onDone);
  }, [title, onDone]);

  return { containerRef, onFinished };
};
