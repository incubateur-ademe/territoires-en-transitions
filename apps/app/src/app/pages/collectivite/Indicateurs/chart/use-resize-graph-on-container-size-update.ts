import * as echarts from 'echarts/core';
import { RefObject, useEffect } from 'react';

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
};

export const useResizeGraphOnContainerSizeUpdate = ({
  containerRef,
  disabled = false,
}: Props) => {
  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;
    let rafId: number | null = null;

    const resizeChart = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const chartDom = container.firstElementChild;
        if (!(chartDom instanceof HTMLDivElement)) return;
        echarts.getInstanceByDom(chartDom)?.resize();
      });
    };

    const observer = new ResizeObserver(resizeChart);
    observer.observe(container);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef, disabled]);
};
