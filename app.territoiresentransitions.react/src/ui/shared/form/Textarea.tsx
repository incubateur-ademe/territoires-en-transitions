import classNames from 'classnames';
import React, {TextareaHTMLAttributes} from 'react';
import {useAutoSizeTextarea} from 'ui/shared/form/useAutoSizeTextarea';

type Props<T> = {
  onInputChange: (value: string) => void;
  /** Minimum height pour le textarea. Valeur défaut "2.25rem" */
  minHeight?: string;
} & TextareaHTMLAttributes<T>;

/** Composant générique Textarea avec auto-resize */
const Textarea = <T extends HTMLTextAreaElement>({
  value,
  onInputChange,
  placeholder,
  className,
  minHeight = '2.25rem',
  ...props
}: Props<T>) => {
  // Appelée au changement de valeur du textarea
  const textareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event.target.value);
  };

  const textareaRef = useAutoSizeTextarea(value?.toString(), minHeight);

  return (
    <textarea
      ref={textareaRef}
      className={classNames(
        `w-full py-2 px-3 text-sm cursor-text rounded-lg outline outline-offset-0 !outline-1 outline-gray-300 focus:outline-blue-500 ${className}`
      )}
      onChange={textareaChange}
      value={value}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default Textarea;
