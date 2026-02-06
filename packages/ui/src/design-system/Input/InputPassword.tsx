import { ForwardedRef, forwardRef, useState } from 'react';
import { InputBase, InputBaseProps } from './InputBase';

export type InputPasswordProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie de mot de passe.
 * Un bouton permet d'afficher/masquer le contenu du champ.
 */
export const InputPassword = forwardRef(
  (
    { ...remainingProps }: InputPasswordProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
      <InputBase
        type={passwordVisible ? 'text' : 'password'}
        icon={{
          buttonProps: {
            type: 'button',
            icon: passwordVisible ? 'lock-password-line' : 'eye-line',
            title: passwordVisible
              ? 'Cacher le mot de passe'
              : 'Voir le mot de passe',
            onClick: () => setPasswordVisible(!passwordVisible),
          },
        }}
        ref={ref}
        {...remainingProps}
      />
    );
  }
);
InputPassword.displayName = 'InputPassword';