import type { MondrianProps } from 'mondrian-treemap';
import { useEffect, useMemo, useState } from 'react';
import {
  getMondrianLevierKey,
  MondrianRect,
} from './mondrian-label-layout.utils';

type LevierData = {
  sector: string;
  lever: string;
  realValue: number;
  color: string;
};

function isLevierData(data: unknown): data is LevierData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'sector' in data &&
    typeof data.sector === 'string' &&
    'lever' in data &&
    typeof data.lever === 'string' &&
    'color' in data &&
    typeof data.color === 'string' &&
    'realValue' in data &&
    typeof data.realValue === 'number' &&
    Number.isFinite(data.realValue) &&
    data.realValue < 0
  );
}

export type MondrianTile = {
  key: string;
  secteur: string;
  levier: string;
  value: number;
  color: string;
  rect: MondrianRect;
};

type MondrianLayout = { source: object; tiles: MondrianTile[] };

function createLayoutCapture(
  source: object,
  onLayout: (layout: MondrianLayout) => void
) {
  const dataByIndex = new Map<number, LevierData>();
  const pending = new Map<number, MondrianTile>();
  let frame = 0;

  const options: NonNullable<MondrianProps['treemapOptions']> = {
    top: 44,
    left: 0,
    right: 0,
    bottom: 0,
    animation: false,
    visibleMin: 0,
    childrenVisibleMin: 0,
    // Les textes HTML partagent les mêmes mesures à l'écran et dans le PNG.
    label: {
      show: true,
      opacity: 0,
      formatter: ({ data, dataIndex }) => {
        if (!isLevierData(data)) {
          dataByIndex.delete(dataIndex);
          pending.delete(dataIndex);
          return '';
        }
        dataByIndex.set(dataIndex, data);
        return String(dataIndex);
      },
    },
    emphasis: { label: { show: false } },
    labelLayout: ({ dataIndex, rect }) => {
      if (dataIndex === undefined) return {};
      const data = dataByIndex.get(dataIndex);
      if (!data) return {};
      pending.set(dataIndex, {
        key: getMondrianLevierKey(data.sector, data.lever),
        secteur: data.sector,
        levier: data.lever,
        value: data.realValue,
        color: data.color,
        // ECharts arrondit à zéro les surfaces inférieures à un pixel.
        rect: {
          ...rect,
          width: Math.max(0, rect.width),
          height: Math.max(0, rect.height),
        },
      });
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const tiles = [...pending.values()];
        pending.clear();
        onLayout({ source, tiles });
      });
      return {};
    },
  };
  return { source, options, cancel: () => cancelAnimationFrame(frame) };
}

/** Récupère la géométrie via l'API publique, sans recalculer les objectifs SGPE. */
export function useMondrianLabelLayout({
  inputData,
  selectedSecteur,
  selectedLevier,
}: Pick<MondrianProps, 'inputData' | 'selectedSecteur' | 'selectedLevier'>): {
  treemapOptions: NonNullable<MondrianProps['treemapOptions']>;
  tiles: MondrianTile[];
} {
  const [layout, setLayout] = useState<MondrianLayout>();
  const capture = useMemo(
    () =>
      createLayoutCapture(
        { inputData, selectedSecteur, selectedLevier },
        setLayout
      ),
    [inputData, selectedSecteur, selectedLevier]
  );

  useEffect(() => capture.cancel, [capture]);

  return {
    treemapOptions: capture.options,
    tiles: layout?.source === capture.source ? layout.tiles : [],
  };
}
