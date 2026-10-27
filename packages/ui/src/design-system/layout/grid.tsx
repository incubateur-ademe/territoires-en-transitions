import { gridClasses, GridLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type GridProps = LayoutElementProps & GridLayout;

/** Répartit ses enfants en colonnes égales, séparées par `gap` (`md` par défaut). */
export const Grid = ({ columns, gap, ...props }: GridProps) =>
  renderLayoutElement(gridClasses({ columns, gap }), props);
