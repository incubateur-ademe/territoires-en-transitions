import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { XAxis, YAxis, type AxisProps } from './axis';
import { Caption, type CaptionProps } from './caption';
import { Quadrant, type QuadrantProps } from './quadrant';

const isFragment = (
  child: ReactElement
): child is ReactElement<{ children?: ReactNode }> => child.type === Fragment;

const collectFromChildren = <TProps,>(
  children: ReactNode,
  matches: (child: ReactElement) => child is ReactElement<TProps>
): TProps[] =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }
    if (matches(child)) {
      return [child.props];
    }
    if (isFragment(child)) {
      return collectFromChildren(child.props.children, matches);
    }
    return [];
  });

const isCaption = (child: ReactElement): child is ReactElement<CaptionProps> =>
  child.type === Caption;

const isQuadrant = (
  child: ReactElement
): child is ReactElement<QuadrantProps> => child.type === Quadrant;

const isXAxis = (child: ReactElement): child is ReactElement<AxisProps> =>
  child.type === XAxis;

const isYAxis = (child: ReactElement): child is ReactElement<AxisProps> =>
  child.type === YAxis;

const readQuadrants = (children: ReactNode): QuadrantProps[] =>
  collectFromChildren(children, isQuadrant);

const readCaption = (children: ReactNode): string | undefined =>
  collectFromChildren(children, isCaption)[0]?.children;

const readXAxis = (children: ReactNode): AxisProps | undefined =>
  collectFromChildren(children, isXAxis)[0];

const readYAxis = (children: ReactNode): AxisProps | undefined =>
  collectFromChildren(children, isYAxis)[0];

export { readCaption, readQuadrants, readXAxis, readYAxis };
