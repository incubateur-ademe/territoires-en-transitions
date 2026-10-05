import { color as echartsColor } from 'echarts/core';
import type { HexColor, IntensityScale } from './treemap-group';

const WHITE = '#FFFFFF';
const WEAKEST_TINT = 0.2;

const toIntensityRatio = <TIntensity extends string>({
  intensity,
  intensityScale,
}: {
  intensity: NoInfer<TIntensity>;
  intensityScale: IntensityScale<TIntensity>;
}): number => {
  const hasSingleIntensity = intensityScale.length === 1;
  if (hasSingleIntensity) {
    return 1;
  }
  return intensityScale.indexOf(intensity) / (intensityScale.length - 1);
};

const toTileColor = <TIntensity extends string>({
  color,
  intensity,
  intensityScale,
}: {
  color: HexColor;
  intensity: NoInfer<TIntensity>;
  intensityScale: IntensityScale<TIntensity>;
}): string => {
  const ratio = toIntensityRatio({ intensity, intensityScale });
  const tint = WEAKEST_TINT + (1 - WEAKEST_TINT) * ratio;
  return echartsColor.lerp(tint, [WHITE, color]);
};

export { toTileColor };
