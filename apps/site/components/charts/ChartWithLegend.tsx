import classNames from 'classnames';
import {defaultColors} from './chartsTheme';

type ChartWithLegendProps = {
  graph: (customColors: string[]) => JSX.Element;
  labels: string[];
  customColors?: string[];
  containerClassname?: string;
  graphContainerClassname?: string;
  legendContainerClassname?: string;
  legendSize?: 'small' | 'default';
};

const ChartWithLegend = ({
  graph,
  labels,
  customColors,
  containerClassname,
  graphContainerClassname = 'h-[300px]',
  legendContainerClassname,
  legendSize = 'default',
}: ChartWithLegendProps) => {
  const getColor = (index: number) => {
    if (customColors && customColors.length) {
      return customColors[index % customColors.length];
    } else {
      return defaultColors[index % defaultColors.length];
    }
  };

  return (
    <div className={containerClassname}>
      <div className={graphContainerClassname}>
        {graph(customColors ?? defaultColors)}
      </div>
      <div
        className={classNames(
          'grid justify-center gap-x-8 gap-y-3',
          legendContainerClassname,
        )}
      >
        {labels.map((label, index) => (
          <div
            key={label}
            className="flex flex-row items-center gap-2 h-[26px]"
          >
            <div
              style={{
                width: '12px',
                minWidth: '12px',
                height: '12px',
                borderRadius: '100%',
                backgroundColor: getColor(index),
              }}
            />
            <div
              className={classNames('text-[#333333] ', {
                'text-[11px] leading-[13px]': legendSize === 'small',
                'text-[16px] leading-[20px]': legendSize === 'default',
              })}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartWithLegend;
