import { stackClasses, StackLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type StackProps = LayoutElementProps & StackLayout;

/** Empile ses enfants verticalement, séparés par `gap` (`md` par défaut). */
export const Stack = ({ gap, align, ...props }: StackProps) =>
  renderLayoutElement(stackClasses({ gap, align }), props);
