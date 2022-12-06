import classNames from 'classnames';
import {Field, FieldAttributes, FieldProps} from 'formik';

import FormField from 'ui/shared/form/FormField';
import Textarea from '../Textarea';

/**
 * Prevents enter key submitting the form.
 */
const preventSubmit = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
};

type FormikInputProps = {
  type?: 'area' | 'text' | 'password';
  hint?: string;
  label: string;
  disabled?: boolean;
  maxLength?: number;
  /** Only to use for textarea */
  minHeight?: string;
};

type FormFieldProps = FieldAttributes<FormikInputProps>;

/**
 * Input field à utiliser dans un formulaire Formik.
 *
 * Peut exécuter du code avec l'événement onBlur si nécessaire.
 * Pour cela, il faut déconstruire Formik pour récupérer handleBlur et le donner à l'input.
 */
const FormikInput = (props: FormFieldProps) => (
  <Field {...props} component={InputField} />
);

export default FormikInput;

const InputField = ({field, form, ...props}: FormikInputProps & FieldProps) => {
  const errorMessage = (form.errors as Record<string, string | undefined>)[
    field.name
  ];
  const isTouched = form.touched[field.name];
  const isError = errorMessage && isTouched;
  const inputType = props.type ?? 'text';

  return (
    <FormField
      label={props.label}
      hint={props.hint}
      htmlFor={field.name}
      errorMessage={isError ? errorMessage : undefined}
    >
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
        <Textarea
          id={field.name}
          className={classNames('fr-input !outline-none', {
            'fr-input--error': isError,
          })}
          onInputChange={() => null}
          maxLength={props.maxLength}
          minHeight={props.minHeight ?? '4rem'}
          {...field}
          {...props}
        />
      )}
    </FormField>
  );
};
