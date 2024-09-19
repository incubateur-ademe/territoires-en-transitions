import { FieldState } from '@tet/ui/design-system/Field';
import classNames from 'classnames';
import {
  DetailedHTMLProps,
  Ref,
  TextareaHTMLAttributes,
  forwardRef,
} from 'react';

// Variantes de taille
export type TextareaSize = 'md' | 'sm';

// Couleur des bordures en fonction du state
const stateToBorderColor: Record<FieldState, string> = {
  default: 'border-grey-4',
  disabled: 'border-grey-4',
  info: 'border-info-1',
  error: 'border-error-1',
  success: 'border-success-1',
  warning: 'border-warning-1',
};

export type TextareaProps = DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> & {
  /** Valeur courante du champ */
  value?: string;
  /** Taille d'affichage */
  displaySize?: TextareaSize;
  /** Variante en fonction d'un état */
  state?: FieldState;
  /** Direction de redimensionnemnt de la textarea */
  resize?: 'both' | 'horizontal' | 'vertical' | 'none';
  /** Textarea disabled */
  disabled?: boolean;
  /** Style custom du container */
  containerClassname?: string;
};

export const Textarea = forwardRef(
  (
    {
      displaySize = 'md',
      state = 'default',
      resize = 'vertical',
      disabled = false,
      containerClassname,
      className,
      ...props
    }: TextareaProps,
    ref?: Ref<HTMLTextAreaElement>
  ) => {
    const borderColor = disabled
      ? stateToBorderColor.disabled
      : stateToBorderColor[state];

    return (
      <div
        className={classNames(
          'flex items-stretch w-full border border-solid rounded-lg bg-grey-1 overflow-hidden focus-within:border-primary-5',
          borderColor,
          containerClassname
        )}
      >
        <textarea
          {...props}
          ref={ref}
          disabled={disabled}
          className={classNames(
            'grow text-grey-8 px-4 outline-none ',
            {
              'text-sm py-2': displaySize === 'sm',
              'text-md py-3': displaySize === 'md',
              resize: resize === 'both',
              'resize-x': resize === 'horizontal',
              'resize-y': resize === 'vertical',
              'resize-none': resize === 'none',
            },
            className
          )}
        />
      </div>
    );
  }
);
