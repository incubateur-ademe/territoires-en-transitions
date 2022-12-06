import classNames from 'classnames';

type Props = {
  label: string;
  hint?: string;
  htmlFor?: string;
  errorMessage?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

const FormField = ({
  label,
  hint,
  htmlFor,
  errorMessage,
  disabled,
  children,
}: Props) => {
  return (
    <div
      className={classNames('fr-input-group flex-grow', {
        'fr-input-group--error': errorMessage,
        'fr-input-group--disabled': disabled,
      })}
    >
      <label htmlFor={htmlFor} className="fr-label mb-2">
        <div>{label}</div>
        {hint && <span className="fr-hint-text !mt-1 !mb-0">{hint}</span>}
      </label>
      {children}
      {errorMessage && <p className="fr-error-text">{errorMessage}</p>}
    </div>
  );
};

export default FormField;
