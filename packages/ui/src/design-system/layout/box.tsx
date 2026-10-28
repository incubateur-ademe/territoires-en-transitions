import { boxClasses, BoxLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type BoxProps = LayoutElementProps & BoxLayout;

/** Conteneur qui porte le padding : l'espace autour, quand `gap` gère l'espace entre. */
export const Box = ({ padding, paddingX, paddingY, ...props }: BoxProps) =>
  renderLayoutElement(boxClasses({ padding, paddingX, paddingY }), props);
