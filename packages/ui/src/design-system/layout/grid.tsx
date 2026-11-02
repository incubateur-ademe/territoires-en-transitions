import { gridClasses, GridLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type GridProps = LayoutElementProps & GridLayout;

export const Grid = ({ columns, gap, ...props }: GridProps) =>
  renderLayoutElement(gridClasses({ columns, gap }), props);
