import {useState} from 'react';
import {Input, InputProps} from './Input';

export type InputPasswordProps = Omit<InputProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie de mot de passe.
 * Un bouton permet d'afficher/masquer le contenu du champ.
 */
export const InputPassword = ({...remainingProps}: InputPasswordProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <Input
      type={passwordVisible ? 'text' : 'password'}
      icon={{
        buttonProps: {
          icon: passwordVisible ? 'lock-password-line' : 'eye-line',
          title: passwordVisible
            ? 'Cacher le mot de passe'
            : 'Voir le mot de passe',
          onClick: () => setPasswordVisible(!passwordVisible),
        },
      }}
      {...remainingProps}
    />
  );
};
