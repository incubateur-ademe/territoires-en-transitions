import classNames from 'classnames';
import { Ref, forwardRef, useId } from 'react';
import { FieldMessage, FieldMessageProps } from '../Field';

export type RadioButtonProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'type' | 'size'
> & {
  /** Libellé associé au radio button */
  label?: React.ReactNode;
  /** Pour styliser le container */
  containerClassname?: string;
  /** Pour styliser le label */
  labelClassname?: string;
} & FieldMessageProps;

export const RadioButton = forwardRef(
  (
    {
      name,
      label,
      state,
      message,
      className,
      containerClassname,
      labelClassname,
      id,
      ...remainingProps
    }: RadioButtonProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div
        className={classNames(
          'flex items-start gap-2 min-w-min',
          containerClassname
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          name={name ?? 'radio'}
          className={classNames(
            `!appearance-none shrink-0 transition-all
            w-5 h-5 rounded-full border border-solid
          border-grey-6 checked:!border-transparent checked:disabled:!border-grey-4
          bg-white checked:bg-primary checked:hover:bg-primary-8 checked:disabled:bg-primary-5
            flex justify-center items-center
            checked:before:w-2 checked:before:h-2 checked:before:bg-white checked:before:rounded-full`,
            className
          )}
          {...remainingProps}
        />
        <div className="flex flex-col gap-1">
          {label && (
            <label
              htmlFor={inputId}
              className={classNames(
                'inline-flex items-center ml-0 font-medium leading-5',
                {
                  'text-grey-8 cursor-pointer': !remainingProps.disabled,
                  'text-grey-6 cursor-not-allowed': remainingProps.disabled,
                },
                labelClassname
              )}
            >
              {label}
            </label>
          )}
          {/** Message complémentaire */}
          <FieldMessage
            state={state}
            message={message}
            messageClassName="my-auto"
          />
        </div>
      </div>
    );
  }
);
RadioButton.displayName = 'RadioButton';