import classNames from 'classnames';

/**
 * Affiche un bouton attirant l'attention de l'utilisateur sur une
 * action potentiellement destructive.
 */
export const BoutonAttention = ({
  children,
  className,
  ...other
}: React.ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      className={classNames(
        'fr-btn fr-btn--secondary fr-label--error',
        className
      )}
      style={{boxShadow: 'inset 0 0 0 1px var(--error-425-625)'}}
      {...other}
    >
      {children}
    </button>
  );
};
