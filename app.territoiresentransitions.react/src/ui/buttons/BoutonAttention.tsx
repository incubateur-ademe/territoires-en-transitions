import {forwardRef, Ref} from 'react';
import classNames from 'classnames';

/**
 * Affiche un bouton attirant l'attention de l'utilisateur sur une
 * action potentiellement destructive.
 */
export const BoutonAttention = forwardRef(
  (
    {children, className, ...other}: React.ComponentPropsWithRef<'button'>,
    ref?: Ref<HTMLButtonElement>
  ) => {
    return (
      <button
        className={classNames(
          'fr-btn fr-btn--secondary fr-label--error',
          className
        )}
        style={{boxShadow: 'inset 0 0 0 1px var(--error-425-625)'}}
        ref={ref}
        {...other}
      >
        {children}
      </button>
    );
  }
);
