import {Tooltip} from '@material-ui/core';
import {Doughnut} from 'react-chartjs-2';
import {addOpacityToHex} from 'utils/addOpacityToHex';

const getTextWidthPx = (
  text: string,
  fontSizePx: number
): {width: number; height: number} => {
  const span = document.createElement('span');
  document.body.appendChild(span);
  span.style.font = 'times new roman';
  span.style.fontSize = fontSizePx + 'px';
  span.style.height = 'auto';
  span.style.width = 'auto';
  span.style.position = 'absolute';
  span.style.whiteSpace = 'no-wrap';
  span.innerHTML = text;

  const width = Math.ceil(span.clientWidth);
  const height = Math.ceil(span.clientHeight);
  document.body.removeChild(span);
  return {width, height};
};

export type DoughnutWithNumberProps = {
  hexColor: string;
  doughnutFillPercentage: number;
  bigText: string;
  smallText: string;
  tooltipText: string;
  bigFontSizePx: number;
  smallFontSizePx: number;
  widthPx?: number;
};
export const DoughnutWithNumber = (props: DoughnutWithNumberProps) => {
  const {width: bigTextWidth} = getTextWidthPx(
    props.bigText,
    props.bigFontSizePx
  );
  const {width: smallTextWidth} = getTextWidthPx(
    props.bigText,
    props.bigFontSizePx
  );

  const canvasWidthPx =
    props.widthPx ?? 2 * Math.max(bigTextWidth, smallTextWidth);

  const data = {
    legend: {display: false},
    datasets: [
      {
        data: [
          props.doughnutFillPercentage,
          100 - props.doughnutFillPercentage,
        ],
        backgroundColor: [props.hexColor, addOpacityToHex(props.hexColor, 0.3)],
      },
    ],
  };
  return (
    <div
      style={{
        position: 'relative',
        width: canvasWidthPx + 'px',
        height: canvasWidthPx + 'px',
      }}
    >
      <Tooltip
        title={<div style={{whiteSpace: 'pre-line'}}>{props.tooltipText}</div>}
      >
        <div>
          <Doughnut
            data={data}
            options={
              {
                plugins: {tooltip: {enabled: false}, legend: {display: false}},
                cutout: '75%',
                responsive: true,
                borderWidth: 0.5,
                animation: false,
              } as Record<string, unknown>
            }
          />
          <div
            style={{
              position: 'absolute',
              top: '0px',
              left: '0px',
              width: canvasWidthPx + 'px',
              height: canvasWidthPx + 'px',
              padding: 0.15 * canvasWidthPx + 'px',
              zIndex: 0,
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: props.bigFontSizePx,
                color: props.hexColor,
                fontWeight: 450,
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
              }}
            >
              <div>{props.bigText}</div>
              <div
                style={{
                  color: props.hexColor,
                  fontSize: props.smallFontSizePx + 'px',
                  textAlign: 'center',
                  fontWeight: 250,
                  lineHeight: 1.1,
                }}
              >
                {props.smallText}
              </div>
            </div>
          </div>
        </div>
      </Tooltip>
    </div>
  );
};
