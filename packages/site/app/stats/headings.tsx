import React, {CSSProperties} from 'react';

type TextAlign = CSSProperties['textAlign'];

type Props = {children: React.ReactNode};

// titre au dessus d'une section
export function SectionHead({children}: Props) {
  return <h2>{children}</h2>;
}

// titre au dessus d'un groupe de graphes
export function ChartHead({children}: Props) {
  return <h5 className="text-primary-9">{children}</h5>;
}

// titre d'un graphe faisant parti d'un groupe
const chartTitleStyle = {textAlign: 'center' as TextAlign, display: 'block'};
export function ChartTitle({children}: Props) {
  return <em style={chartTitleStyle}>{children}</em>;
}
