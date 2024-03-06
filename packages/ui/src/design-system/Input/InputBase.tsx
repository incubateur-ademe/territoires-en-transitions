import {Ref, forwardRef} from 'react';
import classNames from 'classnames';
import {Icon, IconValue} from '@design-system/Icon';
import {DefaultButtonProps} from '@design-system/Button/types';
import {Button} from '@design-system/Button';
import {FieldState, stateToTextColor} from '@design-system/Field';
import {preset} from '@tailwind-preset';

// variantes de taille
export type InputSize = 'md' | 'sm';

// types de champ accepté
export type InputType = 'text' | 'password' | 'date' | 'search' | 'tel';

// couleur des bordures en fonction du `state`
const stateToBorderColor: Record<FieldState, string> = {
  default: 'border-grey-4',
  disabled: 'border-grey-4',
  info: 'border-info-1',
  error: 'border-error-1',
  success: 'border-success-1',
  warning: 'border-warning-1',
};

export type InputBaseProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'type'
> & {
  /** Type de saisie */
  type?: InputType;
  /** Valeur courante du champ */
  value?: string;
  /** Taille d'affichage */
  displaySize?: InputSize;
  /** Id pour les tests */
  'data-test'?: string;
  /** Contenu optionnel pour la zone d'icône à droite du champ */
  icon?: IconContent;
  /** Variante en fonction d'un état */
  state?: FieldState;
  /** Pour styler le container */
  containerClassname?: string;
};

type IconContent =
  // affiche un composant `Icon`
  | {value?: IconValue}
  // affiche un texte
  | {text?: string}
  // affiche un composant `Button`
  | {buttonProps?: Omit<DefaultButtonProps, 'variant' | 'size' | 'className'>};

/**
 * Composant de base pour les champs de saisie.
 */
export const InputBase = forwardRef(
  (props: InputBaseProps, ref?: Ref<HTMLInputElement>) => {
    const {
      className,
      containerClassname,
      type = 'text',
      displaySize = 'md',
      icon,
      state,
      ...remainingProps
    } = props;

    const borderColor = stateToBorderColor[state] || stateToBorderColor.default;

    return (
      <div
        className={classNames(
          'inline-flex items-stretch border border-solid rounded-lg bg-grey-1 overflow-hidden focus-within:border-primary-5',
          borderColor,
          containerClassname
        )}
      >
        <input
          type={type}
          ref={ref}
          className={classNames(
            'grow text-grey-8 px-4 outline-none',
            {
              'text-sm py-2': displaySize === 'sm',
              'text-md py-3': displaySize === 'md',
              'border-r border-solid': !!icon,
              [borderColor]: !!icon,
            },
            className
          )}
          {...remainingProps}
        />
        <InputIconContent {...props} />
      </div>
    );
  }
);

/**
 * Affiche le contenu de la zone icône/texte/bouton à droite du champ.
 */
const InputIconContent = ({
  disabled,
  icon,
  state,
  displaySize: size = 'md',
}: InputBaseProps) => {
  if (!icon) {
    return;
  }

  const iconColor = disabled
    ? 'text-grey-6'
    : stateToTextColor[state] || 'text-primary';

  /** icône */
  if ('value' in icon) {
    return (
      <Icon
        className={classNames('self-center min-w-[3rem]', iconColor)}
        icon={icon.value}
        size={size}
      />
    );
  }

  /** "icône" texte  */
  if ('text' in icon) {
    return (
      <span
        className={classNames(
          'self-center text-xs text-center font-bold min-w-[3rem]',
          iconColor
        )}
      >
        {icon.text}
      </span>
    );
  }

  /** icône bouton */
  if ('buttonProps' in icon) {
    return (
      <Button
        variant="white"
        size={size}
        disabled={disabled}
        className={classNames('rounded-none border-none')}
        // change la couleur de l'icône du bouton pour refléter le `state`
        // TODO: enlever les !important de `Button` pour pouvoir styler le bouton par le className
        style={{color: preset.theme.extend.colors[state]?.['1']}}
        {...icon.buttonProps}
      />
    );
  }
};
