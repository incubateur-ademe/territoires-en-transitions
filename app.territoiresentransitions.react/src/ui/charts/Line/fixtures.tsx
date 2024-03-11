import {Icon} from '@tet/ui';
import {LineData} from './LineChart';

export const fakeNoLineData: LineData[] = [];

export const fakeSimpleLineData: LineData[] = [
  {
    id: 'yolo',
    data: [
      {
        x: 0,
        y: 100,
      },
      {
        x: 1,
        y: 200,
      },
    ],
  },
  {
    id: 'dodo',
    data: [
      {
        x: 0,
        y: 50,
      },
      {
        x: 1,
        y: 187,
      },
      {
        x: 2,
        y: 45,
      },
    ],
  },
  {
    id: 'yili',
    data: [
      {
        x: 2,
        y: 64,
      },
      {
        x: 3,
        y: 120,
      },
    ],
  },
];

export const fakeManyXLineData: LineData[] = [
  {
    id: 'yolo',
    color: '#ff00ff',
    data: [
      {
        x: 2000,
        y: 100,
      },
      {
        x: 2001,
        y: 200,
      },
      {
        x: 2002,
        y: 300,
      },
      {
        x: 2003,
        y: 400,
      },
      {
        x: 2004,
        y: 340,
      },
      {
        x: 2005,
        y: 45,
      },
      {
        x: 2006,
        y: 120,
      },
      {
        x: 2007,
        y: 345,
      },
      {
        x: 2008,
        y: 900,
      },
      {
        x: 2009,
        y: 1000,
      },
      {
        x: 2010,
        y: 1100,
      },
      {
        x: 2011,
        y: 1200,
      },
      {
        x: 2012,
        y: 1300,
      },
      {
        x: 2013,
        y: 1400,
      },
      {
        x: 2014,
        y: 1500,
      },
      {
        x: 2015,
        y: 1600,
      },
      {
        x: 2016,
        y: 1700,
      },
      {
        x: 2017,
        y: 1800,
      },
      {
        x: 2018,
        y: 1900,
      },
      {
        x: 2019,
        y: 2000,
      },
      {
        x: 2020,
        y: 2100,
      },
      {
        x: 2021,
        y: 2200,
      },
    ],
  },
  {
    id: 'dodo',
    color: '#CCEEAA',
    symbole: color => <Icon icon="leaf-fill" style={{color}} />,
    data: [
      {
        x: 2000,
        y: 500,
      },
      {
        x: 2001,
        y: 600,
      },
      {
        x: 2002,
        y: 640,
      },
      {
        x: 2003,
        y: 840,
      },
      {
        x: 2004,
        y: 340,
      },
      {
        x: 2005,
        y: 896,
      },
      {
        x: 2006,
        y: 1400,
      },
      {
        x: 2007,
        y: 1500,
      },
      {
        x: 2008,
        y: 1200,
      },
      {
        x: 2014,
        y: 840,
      },
      {
        x: 2015,
        y: 547,
      },
      {
        x: 2016,
        y: 1300,
      },
      {
        x: 2017,
        y: 1400,
      },
      {
        x: 2018,
        y: 1500,
      },
      {
        x: 2019,
        y: 1350,
      },
      {
        x: 2020,
        y: 245,
      },
      {
        x: 2021,
        y: 102,
      },
    ],
  },
  {
    id: 'yala',
    color: '#DDA023',
    symbole: color => (
      <div className="flex gap-1 w-5">
        <div className="h-1 grow" style={{backgroundColor: color}} />
        <div className="h-1 grow" style={{backgroundColor: color}} />
      </div>
    ),
    data: [
      {
        x: 2000,
        y: 1240,
      },
      {
        x: 2001,
        y: 862,
      },
      {
        x: 2002,
        y: 874,
      },
      {
        x: 2003,
        y: 654,
      },
      {
        x: 2004,
        y: 340,
      },
      {
        x: 2005,
        y: 1480,
      },
      {
        x: 2006,
        y: 1860,
      },
      {
        x: 2007,
        y: 2200,
      },
      {
        x: 2008,
        y: 1467,
      },
      {
        x: 2014,
        y: 1364,
      },
      {
        x: 2015,
        y: 900,
      },
      {
        x: 2016,
        y: 1456,
      },
      {
        x: 2017,
        y: 1678,
      },
      {
        x: 2018,
        y: 2341,
      },
      {
        x: 2019,
        y: 2100,
      },
      {
        x: 2020,
        y: 1670,
      },
      {
        x: 2021,
        y: 1485,
      },
    ],
  },
];
