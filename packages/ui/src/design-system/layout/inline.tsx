import { inlineClasses, InlineLayout } from './layout.classes';
import { LayoutElementProps, renderLayoutElement } from './layout-element';

export type InlineProps = LayoutElementProps & InlineLayout;

/**
 * Aligne ses enfants sur une ligne, avec retour à la ligne par défaut,
 * séparés par `gap` (`sm` par défaut). `collapseBelow` les empile en colonne
 * sous un point de rupture.
 */
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
