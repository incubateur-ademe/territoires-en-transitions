import {ComponentPropsWithoutRef, forwardRef} from 'react';

/**
 * Bouton pour déclencher l'ouverture d'un menu ou d'une liste déroulante.
 * Toutes les props standard d'un bouton sont utilisables, mais la propriété
 * `isOpen` injectée par floating-ui est retirée pour éviter un avertissement.
 */
export const MenuTriggerButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'> & {
    isOpen?: boolean;
  }
>(({isOpen, children, ...props}, ref) => (
  <button {...props} ref={ref}>
    {children}
  </button>
));
