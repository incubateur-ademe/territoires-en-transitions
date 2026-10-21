import { color as echartsColor } from 'echarts/core';
import type { HexColor, IntensityScale } from './treemap-group';

const WHITE = '#FFFFFF';
const FULL_TINT = 1;
const WEAKEST_TINT = 0.5;
const HEADER_TINT = 0.55;

const toTint = <TIntensity extends string>({
  intensity,
  intensityScale,
}: {
  intensity: NoInfer<TIntensity>;
  intensityScale: IntensityScale<TIntensity>;
}): number => {
  const hasSingleIntensity = intensityScale.length === 1;
  if (hasSingleIntensity) {
    return FULL_TINT;
  }
  const isWeakest = intensityScale.indexOf(intensity) === 0;
  return isWeakest ? WEAKEST_TINT : FULL_TINT;
};

const toTileColor = <TIntensity extends string>({
  color,
  intensity,
  intensityScale,
}: {
  color: HexColor;
  intensity: NoInfer<TIntensity>;
  intensityScale: IntensityScale<TIntensity>;
}): string =>
  echartsColor.lerp(toTint({ intensity, intensityScale }), [WHITE, color]);

const toHeaderColor = (color: HexColor): string =>
  echartsColor.lerp(HEADER_TINT, [WHITE, color]);

export { toHeaderColor, toTileColor };
