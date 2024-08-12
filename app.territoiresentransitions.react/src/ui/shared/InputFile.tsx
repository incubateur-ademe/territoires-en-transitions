// copié depuis https://github.com/dataesr/react-dsfr/blob/master/src/components/interface/File/File.js

import classNames from 'classnames';

interface InputFileProps {
  className?: string;
  label: string;
  multiple?: boolean;
  onChange?: (...args: any[]) => any;
  errorMessage?: string;
  hint?: string;
  accept?: string;
}

/**
 * Affiche le sélecteur de fichiers
 */
const InputFile = ({
  className,
  label,
  errorMessage,
  hint,
  onChange = () => undefined,
  multiple = false,
  accept,
  ...remainingProps
}: InputFileProps) => {
  const _className = classNames('fr-upload-group', className, {
    [`ds-fr--${label}`]: label,
  });

  return (
    <div {...remainingProps} className={_className}>
      <label className="fr-label" htmlFor="file-upload">
        {label}
        {!!hint && <p className="fr-hint-text">{hint}</p>}
      </label>
      <input
        onChange={onChange}
        className="fr-upload"
        type="file"
        aria-describedby={hint || undefined}
        multiple={multiple}
        accept={accept}
      />
      {!!errorMessage && (
        <p id="file-upload-with-error-desc-error" className="fr-error-text">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default InputFile;
