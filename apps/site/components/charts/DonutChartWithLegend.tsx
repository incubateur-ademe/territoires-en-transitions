import { defaultVarColors } from './chartsTheme';
import DonutChart from './DonutChart';

type DonutChartWithLegendProps = {
  graphContainerClassname?: string;
  data: {
    id: string;
    value: number;
    color?: string;
  }[];
  unit?: string;
  unitSingular?: boolean;
  decimals?: number;
  customMargin?: { top: number; right: number; bottom: number; left: number };
  zoomEffect?: boolean;
  displayPercentageValue?: boolean;
};

const DonutChartWithLegend = ({
  graphContainerClassname = 'h-[300px]',
  data,
  ...otherProps
}: DonutChartWithLegendProps) => {
  const dataWithColor = data
    .filter((d) => d.value !== 0)
    .map((d, index) => ({
      ...d,
      color: d.color
        ? d.color
        : defaultVarColors[index % defaultVarColors.length],
    }));

  return (
    <div>
      <div className={graphContainerClassname}>
        <DonutChart data={dataWithColor} {...otherProps} />
      </div>
      <div className="grid grid-cols-3 justify-center gap-x-8 gap-y-3 my-6">
        {dataWithColor.map((d) => (
          <div key={d.id} className="flex flex-row items-center gap-2 h-[26px]">
            <div
              style={{
                width: '12px',
                minWidth: '12px',
                height: '12px',
                borderRadius: '100%',
                backgroundColor: d.color,
              }}
            />
            <div className="text-[#333333] text-[11px] leading-[13px]">
              {d.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChartWithLegend;
