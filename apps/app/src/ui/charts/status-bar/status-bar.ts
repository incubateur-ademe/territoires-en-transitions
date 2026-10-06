import type { HexColor } from '../treemap/treemap-group';

type StatusScale<TStatus extends string> = readonly [
  { status: TStatus; color: HexColor },
  ...{ status: TStatus; color: HexColor }[]
];

type StatusBar<TStatus extends string> = {
  id: string;
  label: string;
  value: number;
  status: TStatus;
};

export type { StatusBar, StatusScale };
