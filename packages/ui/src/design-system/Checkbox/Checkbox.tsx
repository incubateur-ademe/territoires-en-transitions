import classNames from 'classnames';
import {FieldMessage, FieldMessageProps} from '@design-system/Field';

export type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'type' | 'size'
> & {
  /** Libellé associé à la case à cocher */
  label?: string;
  /** Variante visuelle */
  variant?: 'checkbox' | 'switch';
} & FieldMessageProps;

/**
 * Affiche une case à cocher (ou un interrupteur) et optionnellement un
 * libellé, et un message complémentaire éventuellement stylé en fonction d'un
 * état.
 */
export const Checkbox = ({
  label,
  state,
  message,
  className,
  variant = 'checkbox',
  ...remainingProps
}: CheckboxProps) => {
  const input = (
    <input
      type="checkbox"
      className={classNames(
        // styles communs
        '!appearance-none checked:before:icon-check-line checked:bg-primary checked:disabled:bg-primary-5',
        {
          /** Checkbox */
          'flex content-center justify-center border border-solid !border-grey-6 rounded flex-wrap w-5 h-5 !text-white  checked:!border-transparent checked:hover:bg-primary-8 checked:!disabled:border-grey-4':
            variant === 'checkbox',

          /** Switch */
          'relative bg-grey-4 rounded-full w-10 h-6 before:absolute before:h-4 before:w-4 before:left-1 before:top-1 before:bg-white before:duration-200 before:rounded-full checked:text-primary checked:before:translate-x-4 checked:before:flex checked:before:items-center checked:before:justify-center':
            variant === 'switch',
        },

        className
      )}
      {...remainingProps}
    />
  );

  return (
    <div className="flex flex-col w-max">
      {label ? (
        /** affiche l'input et le libellé */
        <label
          className={classNames('inline-flex items-center cursor-pointer ', {
            'text-grey-8': !remainingProps.disabled,
            'text-grey-6': remainingProps.disabled,
          })}
        >
          {input}
          <span className="pl-2">{label}</span>
        </label>
      ) : (
        /** OU affiche que l'input si le libellé n'est pas renseigné */
        input
      )}
      {/** Message complémentaire */}
      <FieldMessage
        state={state}
        message={message}
        messageClassName={classNames('pt-1', {
          'pl-7': variant === 'checkbox',
          'pl-12': variant === 'switch',
        })}
      />
    </div>
  );
};
