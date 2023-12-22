import classNames from 'classnames';
import {buttonThemeClassnames} from '../utils';
import ButtonContent from './ButtonContent';
import {ButtonProps, isAnchorButton, isDefaultButton} from '../types';

/**
 * Composant bouton par défaut, ayant pour props toutes les props habituelles d'un button tag.
 * */
export const Button = (props: ButtonProps) => {
  const {
    children,
    disabled = false,
    variant = 'primary',
    size = 'md',
    className,
  } = props;

  const isIconButton = !children;
  const {text, background, border} = buttonThemeClassnames[variant];

  const buttonClassname = classNames(
    'rounded-lg w-fit border border-solid font-bold group',
    {
      // Format du bouton en fonction de la taille choisie
      'text-xs py-2': size === 'xs',
      'text-sm py-3': size === 'sm',
      'text-base py-3.5': size === 'md',
      'text-2xl py-5': size === 'xl',

      // Padding en fonction de la taille choisie
      'px-5':
        (size === 'xs' && !isIconButton) || (size === 'xl' && isIconButton),
      'px-6': size !== 'xs' && !isIconButton,

      // Padding sur les boutons ne contenant qu'une icône
      'px-2': size === 'xs' && isIconButton,
      'px-3': size === 'sm' && isIconButton,
      'px-3.5': size === 'md' && isIconButton,

      // Styles du curseur
      'cursor-pointer': !disabled,
      'cursor-not-allowed': disabled,
    },
    text,
    background,
    border
  );

  if (isDefaultButton(props)) {
    return (
      <button {...props} className={classNames(buttonClassname, className)}>
        <ButtonContent {...{...props, children, disabled, variant, size}} />
      </button>
    );
  } else if (isAnchorButton(props)) {
    const {external = false} = props;

    return (
      <a
        {...props}
        // bg-none permet d'effacer un style dsfr appliqué à la balise <a/>
        // after:hidden supprime l'icône external par défaut du dsfr
        className={classNames(
          'inline-block w-fit bg-none after:hidden',
          buttonClassname,
          className
        )}
        target={external ? '_blank' : props.target}
        rel={external ? 'noreferrer noopener' : props.rel}
        onClick={evt => {
          if (disabled) evt.preventDefault();
        }}
      >
        <ButtonContent
          {...{...props, children, disabled, variant, size}}
          external={external || props.target === '_blank'}
        />
      </a>
    );
  }
};
