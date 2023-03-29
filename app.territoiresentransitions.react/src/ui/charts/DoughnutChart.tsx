import {ResponsivePie} from '@nivo/pie';
import {defaultColors, nivoColorsSet, theme} from './chartsTheme';

/**
 * Graphe donut générique à partir du composant nivo/pie
 *
 * @param data - tableau de données à afficher
 * @param label - (optionnel) affichage des labels sur le
 * graphe au lieu de la légende
 */

type DoughnutChartProps = {
  data: {
    id: string;
    value: number;
    color?: string;
  }[];
  label?: boolean;
};

const DoughnutChart = ({data, label = false}: DoughnutChartProps) => {
  const defaultData = [{id: 'NA', value: 1, color: '#ccc'}];

  let localData = data.map((d, index) => ({
    ...d,
    color: d.color
      ? d.color
      : data.length <= defaultColors.length
      ? defaultColors[index % defaultColors.length]
      : nivoColorsSet[index % nivoColorsSet.length],
  }));

  const isDefaultData = (): boolean => {
    return data.length === 0 || data.filter(d => d.value !== 0).length === 0;
  };

  return (
    <ResponsivePie
      data={isDefaultData() ? defaultData : localData}
      theme={theme}
      colors={{datum: 'data.color'}}
      margin={{top: 30, right: 50, bottom: 70, left: 50}}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor={{
        from: 'color',
        modifiers: [['darker', 0.2]],
      }}
      enableArcLinkLabels={label || isDefaultData()}
      arcLinkLabelsDiagonalLength={10}
      arcLinkLabelsStraightLength={5}
      arcLinkLabelsTextColor="#333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{from: 'color'}}
      enableArcLabels={isDefaultData() ? false : true}
      arcLabelsSkipAngle={12}
      arcLabelsTextColor={{
        from: 'color',
        modifiers: [['darker', 2]],
      }}
      animate={false}
      tooltip={({datum: {id, value, color}}) => {
        if (isDefaultData()) {
          return null;
        }

        let percentage =
          value / localData.reduce((sum, curVal) => sum + curVal.value, 0);
        if (percentage < 0.01) {
          percentage = Math.round(percentage * 10000) / 100;
        } else {
          percentage = Math.round(percentage * 100);
        }

        return (
          <div
            style={{
              fontFamily: '"Marianne", arial, sans-serif',
              fontSize: 14,
              background: '#fff',
              padding: '9px 12px',
              border: '1px solid #ccc',
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
            <span style={{paddingBottom: '3px'}}>
              {id} :{' '}
              <strong>
                {value} ({percentage}%)
              </strong>
            </span>
          </div>
        );
      }}
      legends={[
        {
          data: label
            ? []
            : localData.slice(0, 3).map(d => ({
                id: d.id,
                label: `${
                  d.id.length > 10 && data.length > 1
                    ? `${d.id.slice(0, 10)}...`
                    : d.id
                }`,
                color: d.color,
              })),
          anchor: 'bottom',
          direction: 'row',
          justify: false,
          translateX: 0,
          translateY: 56,
          itemsSpacing: 0,
          itemWidth: 120,
          itemHeight: 18,
          itemDirection: 'left-to-right',
          itemOpacity: 1,
          symbolSize: 18,
          symbolShape: 'circle',
        },
      ]}
    />
  );
};

export default DoughnutChart;
