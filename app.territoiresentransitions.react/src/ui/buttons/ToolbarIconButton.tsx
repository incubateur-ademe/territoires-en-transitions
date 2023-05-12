import {forwardRef, Ref} from 'react';
import classNames from 'classnames';

export type ToolbarIconButtonProps = React.ComponentPropsWithRef<'button'> & {
  icon: string;
};

/**
 * Affiche un bouton icône DSFR pour une barre d'outil
 *
 * @param aria-pressed Permet de déterminer le style du bouton et de l'icône associée.
 * @param icon Indique l'icône DSFR à utiliser (ex: passer `info` pour que
 * `fr-icon-info-line` ou `fr-icon-info-fill` soit utilisé en fonction de la
 * valeur de `aria-pressed`)
 */
export const ToolbarIconButton = forwardRef(
  (
    {
      className,
      'aria-pressed': pressed,
      icon,
      ...props
    }: ToolbarIconButtonProps,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      className={classNames('fr-btn fr-btn--tertiary fr-btn--sm', {
        [`fr-icon-${icon}-line`]: !pressed,
        [`fr-icon-${icon}-fill !bg-gray-200`]: pressed,
      })}
      aria-pressed={pressed}
      ref={ref}
      {...props}
    />
  )
);

/**
 * Affiche un bouton icône DSFR avec état "toggle"
 *
 * @param icon Indique l'icône DSFR à utiliser (ex: passer `info` pour que
 * `fr-icon-info-line` ou `fr-icon-info-fill` soit utilisé en fonction de la
 * valeur de `aria-pressed`)
 * @param active Passer la valeur de `icon` si le bouton est enfoncé ou `false` sinon.
 * @param onClick Reçoit la valeur de `icon` si `active` était à `false` et `false` sinon.
 */
export const ToolbarIconToggleButton = forwardRef(
  (
    {
      icon,
      active,
      onClick,
      ...props
    }: Omit<ToolbarIconButtonProps, 'onClick' | 'aria-pressed'> & {
      active: string | false;
      onClick: (active: string | false) => void;
    },
    ref?: Ref<HTMLButtonElement>
  ) => {
    const pressed = active === icon;
    return (
      <ToolbarIconButton
        aria-pressed={pressed}
        icon={icon}
        ref={ref}
        onClick={() => onClick(pressed ? false : icon)}
        {...props}
      />
    );
  }
);
