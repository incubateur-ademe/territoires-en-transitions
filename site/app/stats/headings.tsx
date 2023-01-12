import React, { CSSProperties } from 'react';
import { fr } from '@codegouvfr/react-dsfr';

type TextAlign = CSSProperties['textAlign'];

type Props = { children: React.ReactNode };

// titre au dessus d'une section
export function SectionHead({ children }: Props) {
  return <h2 className={fr.cx('fr-mt-4w')}>{children}</h2>;
}

// titre au dessus d'un groupe de graphes
const chartHeadStyle = {
  marginTop: fr.spacing('4w'),
  textAlign: 'center' as TextAlign,
};
export function ChartHead({ children }: Props) {
  return <h6 style={chartHeadStyle}>{children}</h6>;
}

// titre d'un graphe faisant parti d'un groupe
const chartTitleStyle = { textAlign: 'center' as TextAlign, display: 'block' };
export function ChartTitle({ children }: Props) {
  return <em style={chartTitleStyle}>{children}</em>;
}
