type AxisProps = {
  name: string;
  minLabel: string;
  maxLabel: string;
  toValueLabel?: (value: number) => string;
};

const XAxis = (_props: AxisProps): null => null;

const YAxis = (_props: AxisProps): null => null;

const toAxisValueLabel = (axis: AxisProps, value: number): string =>
  axis.toValueLabel?.(value) ?? String(value);

export { toAxisValueLabel, XAxis, YAxis };
export type { AxisProps };
