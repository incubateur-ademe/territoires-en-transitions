import { Ref, forwardRef } from 'react';
import classNames from 'classnames';
import { InputBaseProps } from './InputBase';
import { FieldState } from '../Field';

const stateToBorderColor: Record<FieldState, string> = {
  default: 'border-grey-4',
  disabled: 'border-grey-4',
  info: 'border-info-1',
  error: 'border-error-1',
  success: 'border-success-1',
  warning: 'border-warning-1',
};

export type InputFileProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de sélection d'un fichier
 * TODO: drag and drop des fichiers
 */

export const InputFile = forwardRef(
  (
    {
      displaySize = 'sm',
      state,
      containerClassname,
      ...remainingProps
    }: InputFileProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    const borderColor =
      state !== undefined ? stateToBorderColor[state] : stateToBorderColor.info;

    return (
      <div
        className={classNames(
          'bg-grey-1 border border-dashed rounded-lg flex flex-col justify-center items-center',
          {
            'p-4': displaySize === 'sm',
            'p-5': displaySize === 'md',
          },
          borderColor,
          containerClassname
        )}
      >
        <input
          ref={ref}
          id="input-file"
          type="file"
          className="invisible w-0 h-0"
          {...remainingProps}
        />
        <label
          htmlFor="input-file"
          className={classNames(
            'w-fit m-0 border-solid cursor-pointer rounded-lg border font-bold text-primary-7 hover:text-primary-8 bg-primary-0 hover:!bg-primary-1 border-primary-7 hover:!border-primary-8',
            {
              'text-xs py-2 px-5': displaySize === 'sm',
              'text-sm py-2.5 px-6': displaySize === 'md',
            }
          )}
        >
          Choisir un fichier
        </label>
      </div>
    );
  }
);
