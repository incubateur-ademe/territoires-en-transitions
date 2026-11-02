import { inlineClasses, InlineLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type InlineProps = LayoutElementProps & InlineLayout;

export const Inline = ({
  gap,
  align,
  justify,
  wrap,
  collapseBelow,
  ...props
}: InlineProps) =>
  renderLayoutElement(
    inlineClasses({ gap, align, justify, wrap, collapseBelow }),
    props
  );
