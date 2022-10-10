import classNames from 'classnames';
import {Field, FieldAttributes, FieldProps} from 'formik';

/**
 * Prevents enter key submitting the form.
 */
const preventSubmit = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
};

type FormInputProps = {
  type?: 'area' | 'text' | 'password';
  hint?: string;
  label: string;
  disabled?: boolean;
  maxLength?: number;
};

type FormFieldProps = FieldAttributes<FormInputProps>;

/**
 * Input field à utiliser dans un formulaire Formik.
 *
 * Peut exécuter du code avec l'événement onBlur si nécessaire.
 * Pour cela, il faut déconstruire Formik pour récupérer handleBlur et le donner à l'input.
 */
const FormInput = (props: FormFieldProps) => (
  <Field {...props} component={InputField} />
);

export default FormInput;

const InputField = ({field, form, ...props}: FormInputProps & FieldProps) => {
  const errorMessage = form.errors[field.name];
  const isTouched = form.touched[field.name];
  const isError = errorMessage && isTouched;
  const inputType = props.type ?? 'text';

  return (
    <div
      className={classNames('fr-input-group flex-grow', {
        'fr-input-group--error': isError,
        'fr-input-group--disabled': props.disabled,
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
          className={classNames('fr-input', {'fr-input--error': isError})}
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
          className={classNames('fr-input', {'fr-input--error': isError})}
          maxLength={props.maxLength}
          {...field}
          {...props}
        />
      )}
      {inputType === 'area' && (
        <textarea
          id={field.name}
          className={classNames('fr-input', {'fr-input--error': isError})}
          maxLength={props.maxLength}
          {...field}
          {...props}
        />
      )}
      {isError && <p className="fr-error-text">{errorMessage}</p>}
    </div>
  );
};
