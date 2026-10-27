import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

/**
 * Éléments HTML qu'une primitive de layout peut rendre : le layout porte aussi
 * la sémantique de la page (sections, listes, navigation…).
 */
export type LayoutElement =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'main'
  | 'nav'
  | 'ul'
  | 'ol'
  | 'li';

export type LayoutElementProps = HTMLAttributes<HTMLElement> & {
  as?: LayoutElement;
};

export const renderLayoutElement = (
  layoutClassName: string,
  { as: Element = 'div', className, ...props }: LayoutElementProps
) => (
  <Element className={cn(layoutClassName, className) || undefined} {...props} />
);
