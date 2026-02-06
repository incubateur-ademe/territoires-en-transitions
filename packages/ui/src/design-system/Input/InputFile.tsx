import { Ref, forwardRef, useState } from 'react';
import classNames from 'classnames';
import { InputBaseProps } from './InputBase';
import { FieldState } from '../Field';
import { Icon } from '../Icon';

const stateToBorderColor: Record<FieldState, string> = {
  default: 'border-grey-4',
  disabled: 'border-grey-4',
  info: 'border-info-1',
  error: 'border-error-1',
  success: 'border-success-1',
  warning: 'border-warning-1',
};

export type InputFileProps = Omit<InputBaseProps, 'icon' | 'type'> & {
  // appelée quand l'utilisateur drop des fichiers
  onDropFiles?: (files: FileList) => void;
};

/**
 * Affiche un champ de sélection d'un fichier
 */
export const InputFile = forwardRef(
  (
    {
      displaySize = 'sm',
      state,
      containerClassname,
      onDropFiles,
      ...remainingProps
    }: InputFileProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    const borderColor =
      state !== undefined ? stateToBorderColor[state] : stateToBorderColor.info;
    const [dragOver, setDragOver] = useState(false);
    const isDraggingOver = dragOver && onDropFiles;

    return (
      <div
        className={classNames(
          'bg-grey-1 border rounded-lg flex flex-col justify-center items-center',
          {
            'p-4': displaySize === 'sm',
            'p-5': displaySize === 'md',
            'border-dashed': !isDraggingOver,
            'border-solid border-info-1 shadow-[0_4px_20px_0_rgba(0,0,0,0.05)':
              isDraggingOver,
          },
          borderColor,
          containerClassname
        )}
        onDrop={(e) => {
          e.preventDefault();
          onDropFiles?.(e.dataTransfer.files);
          setDragOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
      >
        {onDropFiles && (
          <div className="text-grey-7 font-bold flex flex-col items-center">
            <Icon icon="upload-line" className="text-grey-5" />
            <p
              className={classNames('mb-2', {
                'text-sm': displaySize === 'sm',
              })}
            >
              Glisser votre fichier
            </p>
            <p className="text-xs mb-3">OU</p>
          </div>
        )}
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
InputFile.displayName = 'InputFile';