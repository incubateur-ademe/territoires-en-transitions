import classNames from 'classnames';
import {FieldProps} from 'formik';

type FormInputProps = {
  type?: 'area' | 'text' | 'password';
  hint?: string;
  label: string;
  disabled?: boolean;
  maxLength?: number;
};

/**
 * Prevents enter key submitting the form.
 */
const preventSubmit = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
};

const FormInput = ({field, form, ...props}: FormInputProps & FieldProps) => {
  const errorMessage = form.errors[field.name];
  const isTouched = form.touched[field.name];
  const isError = errorMessage && isTouched;
  const inputType = props.type ?? 'text';

  return (
    <div
      className={classNames('fr-input-group flex-grow', {
        ['fr-input-group--error']: isError,
        ['fr-input-group--disabled']: props.disabled,
      })}
    >
      <label htmlFor={field.name} className="fr-label">
        {props.label}
        {props.hint && <span className="fr-hint-text">{props.hint}</span>}
      </label>
      {inputType === 'text' && (
        <input
          id={field.name}
          type={inputType}
          className={classNames('fr-input', {['fr-input--error']: isError})}
          maxLength={props.maxLength}
          onKeyDown={preventSubmit}
          {...field}
          {...props}
        />
      )}
      {inputType === 'password' && (
        <input
          id={field.name}
          type={inputType}
          className={classNames('fr-input', {['fr-input--error']: isError})}
          maxLength={props.maxLength}
          {...field}
          {...props}
        />
      )}
      {inputType === 'area' && (
        <textarea
          id={field.name}
          className={classNames('fr-input', {['fr-input--error']: isError})}
          maxLength={props.maxLength}
          {...field}
          {...props}
        />
      )}
      {isError && <p className="fr-error-text">{errorMessage}</p>}
    </div>
  );
};

export default FormInput;
