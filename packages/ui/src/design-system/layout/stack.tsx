import { stackClasses, StackLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type StackProps = LayoutElementProps & StackLayout;

export const Stack = ({ gap, align, ...props }: StackProps) =>
  renderLayoutElement(stackClasses({ gap, align }), props);
