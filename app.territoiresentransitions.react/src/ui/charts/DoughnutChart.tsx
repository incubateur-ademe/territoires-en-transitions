import {ResponsivePie} from '@nivo/pie';
import {defaultColors, theme} from './chartsTheme';

/**
 * Graphe donut générique à partir du composant nivo/pie
 *
 * @param data - tableau de données à afficher
 */

type DoughnutChartProps = {
  data: {
    id: string;
    value: number;
    color?: string;
  }[];
};

const DoughnutChart = ({data}: DoughnutChartProps) => {
  const defaultData = [{id: 'NA', value: 1}];

  const isDefaultData = (): boolean => {
    return data.length === 0 || data.filter(d => d.value !== 0).length === 0;
  };

  const getCustomColors = () => {
    if (isDefaultData()) {
      return ['#CCC'];
    } else {
      const areDataWithColors: boolean = data.reduce((result, currVal) => {
        if (currVal.color !== undefined) return result;
        else return false;
      }, true);

      if (areDataWithColors) {
        return {datum: 'data.color'};
      } else if (data.length <= defaultColors.length) {
        return defaultColors;
      } else return undefined;
    }
  };

  return (
    <ResponsivePie
      data={isDefaultData() ? defaultData : data}
      theme={theme}
      colors={getCustomColors() ?? {scheme: 'set3'}}
      margin={{top: 50, right: 50, bottom: 50, left: 50}}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor={{
        from: 'color',
        modifiers: [['darker', 0.2]],
      }}
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
                {value} (
                {Math.round(
                  (value /
                    data.reduce((sum, curVal) => sum + curVal.value, 0)) *
                    100
                )}
                % )
              </strong>
            </span>
          </div>
        );
      }}
    />
  );
};

export default DoughnutChart;
