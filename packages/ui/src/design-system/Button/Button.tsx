import {Ref, forwardRef} from 'react';
import classNames from 'classnames';

import {buttonSizeClassnames, buttonThemeClassnames} from './theme';
import ButtonContent from './ButtonContent';
import {
  ButtonContentProps,
  ButtonHTMLProps,
  ButtonProps,
  isAnchor,
} from './types';

/**
 * Composant bouton par défaut, ayant pour props toutes les props habituelles d'un button tag.
 * */
// On déstructure toutes les props rajoutées qui ne sont pas des props des tags HTML <button> ou <a>
// Ce qui nous permet de ne donner que les props restantes natives au tag HTML
export const Button = forwardRef(
  (
    {
      children,
      disabled = false,
      variant = 'primary',
      size = 'md',
      className,
      icon,
      iconPosition = 'left',
      external,
      ...props
    }: ButtonProps,
    ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    const isIconButton = !children;

    const buttonState = disabled ? 'disabled' : 'default';

    const {text, background, border} =
      buttonThemeClassnames[variant][buttonState];

    const sizeClassName =
      buttonSizeClassnames[size][isIconButton ? 'iconButton' : 'textButton'];

    const buttonClassname = classNames(
      'w-fit flex items-center border-solid group',
      {
        // Layout du bouton
        'gap-1': size === 'xs',
        'gap-2': size === 'sm' || size === 'md' || size === 'xl',
        // Styles du curseur
        'cursor-pointer': !disabled,
        'cursor-not-allowed': disabled,
        // Bordures et polices
        'rounded-lg border font-bold': variant !== 'underlined',
        'border-b border-t-0 border-x-0 !p-px font-medium':
          variant === 'underlined',
        'hover:border-b-2 hover:!pb-0': variant === 'underlined' && !disabled,
      },
      text,
      background,
      border,
      sizeClassName
    );

    /** Reconstitution des props données au contenu du bouton */
    const buttonContentProps: ButtonContentProps = {
      children,
      variant,
      size,
      icon,
      disabled,
    };

    const isButton = !isAnchor(props);

    /** On affiche un bouton par défaut */
    if (isButton) {
      // On réintegre la prop disabled qui a été déstructurée plus haut
      const buttonProps = {...props, disabled} as ButtonHTMLProps;
      return (
        <button
          ref={ref as Ref<HTMLButtonElement>}
          {...buttonProps}
          className={classNames(
            buttonClassname,
            {'flex-row-reverse': iconPosition === 'right'},
            className
          )}
        >
          <ButtonContent {...buttonContentProps} />
        </button>
      );

      /** Ou bien une ancre si un lien href est donné (cf ./types.ts) */
    } else {
      const anchorProps = props;
      const openInNewTab = external || props.target === '_blank';
      return (
        <a
          {...anchorProps}
          ref={ref as Ref<HTMLAnchorElement>}
          // bg-none permet d'effacer un style dsfr appliqué à la balise <a/>
          // after:hidden supprime l'icône external par défaut du dsfr
          className={classNames(
            'bg-none after:hidden',
            buttonClassname,
            {'flex-row-reverse': iconPosition === 'right' || openInNewTab},
            className
          )}
          target={openInNewTab ? '_blank' : props.target}
          rel={openInNewTab ? 'noreferrer noopener' : props.rel}
          onClick={evt => {
            if (disabled) evt.preventDefault();
            else props.onClick?.(evt);
          }}
        >
          <ButtonContent
            {...buttonContentProps}
            icon={openInNewTab ? 'external-link-line' : icon}
          />
        </a>
      );
    }
  }
);
