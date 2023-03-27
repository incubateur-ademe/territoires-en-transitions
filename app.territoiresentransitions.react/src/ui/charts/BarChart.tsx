import {ResponsiveBar} from '@nivo/bar';
import {defaultColors} from './chartsTheme';

type BarChartProps = {
  data: {}[];
  indexBy: string;
  keys: string[];
  indexTitles?: string[];
  layout?: 'horizontal' | 'vertical';
  inverted?: boolean;
  customColors?: boolean;
  unit?: string;
};

const BarChart = ({
  data,
  indexBy,
  keys,
  indexTitles = [],
  layout,
  inverted = false,
  customColors = false,
  unit = '',
}: BarChartProps) => {
  let localData = [];
  let localIndexTitles: string[] = [];

  if (inverted) {
    for (let i = data.length - 1; i >= 0; i--) {
      localData.push(data[i]);
      if (indexTitles) localIndexTitles.push(indexTitles[i]);
    }
  } else {
    localData = [...data];
    localIndexTitles = [...indexTitles];
  }

  return (
    <ResponsiveBar
      data={localData}
      keys={keys}
      indexBy={indexBy}
      margin={{top: 30, right: 60, bottom: 70, left: 60}}
      layout={layout}
      colors={
        customColors
          ? //@ts-ignore
            ({id, data}) => `${data[`${id}_color`]}`
          : defaultColors
      }
      borderColor={{
        from: 'color',
        modifiers: [['darker', 1.6]],
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend:
          layout === 'horizontal'
            ? `${unit.slice(0, 1).toUpperCase()}${unit.slice(1).toLowerCase()}`
            : `${indexBy.slice(0, 1).toUpperCase()}${indexBy
                .slice(1)
                .toLowerCase()}`,
        legendPosition: 'middle',
        legendOffset: 45,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend:
          layout === 'horizontal'
            ? `${indexBy.slice(0, 1).toUpperCase()}${indexBy
                .slice(1)
                .toLowerCase()}`
            : `${unit.slice(0, 1).toUpperCase()}${unit.slice(1).toLowerCase()}`,
        legendPosition: 'middle',
        legendOffset: -40,
      }}
      enableGridX={true}
      enableGridY={false}
      label={d =>
        d.value ? (d.value >= 5 ? `${Math.round(d.value)}` : '') : ''
      }
      tooltip={({id, value, index, indexValue, color}) => {
        return (
          <div
            style={{
              fontFamily: '"Marianne", arial, sans-serif',
              fontSize: 14,
              background: '#fff',
              padding: '9px 12px',
              border: '1px solid #ccc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'start',
            }}
          >
            <div>
              {localIndexTitles.length ? localIndexTitles[index] : indexValue}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: color,
                  width: '12px',
                  height: '12px',
                  marginRight: '7px',
                }}
              ></div>
              <span>
                {id} :{' '}
                <strong>
                  {Math.round(value * 100) / 100} {unit}
                </strong>
              </span>
            </div>
          </div>
        );
      }}
    />
  );
};

export default BarChart;
