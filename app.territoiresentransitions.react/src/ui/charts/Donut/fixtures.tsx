import { Icon } from '@/ui';
import { DonutData } from './DonutChart';

export const fakeNoDonutData: DonutData[] = [];

export const fakeSimpleDonutData: DonutData[] = [
  {
    id: 'yolo',
    value: 100,
  },
  {
    id: 'dodo',
    value: 200,
    symbole: (color) => <Icon icon="leaf-fill" style={{ color }} />,
  },
];

export const fakeSmallDonutData: DonutData[] = [
  {
    id: 'yolo',
    value: 100,
  },
  {
    id: 'dodo',
    value: 2,
  },
  {
    id: 'lolo',
    value: 1,
  },
];

export const fakeComplexeDonutData: DonutData[] = [
  {
    id: 'yolo',
    value: 100,
  },
  {
    id: 'dodo',
    value: 200,
  },
  {
    id: 'yili',
    value: 100,
  },
  {
    id: 'didi',
    value: 200,
  },
  {
    id: 'yala',
    value: 100,
  },
  {
    id: 'dada',
    value: 200,
  },
  {
    id: 'yulu',
    value: 100,
  },
  {
    id: 'dudu',
    value: 200,
  },
  {
    id: 'zili',
    value: 200,
  },
  {
    id: 'zala',
    value: 200,
  },
];
