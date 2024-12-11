import { Field, Input, Textarea } from '@/ui';
import classNames from 'classnames';
import { FieldAttributes, FieldProps, Field as FormikField } from 'formik';

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
  className?: string;
  inputClassName?: string;
};

type FormFieldProps = FieldAttributes<FormikInputProps>;

/**
 * Input field à utiliser dans un formulaire Formik.
 *
 * Peut exécuter du code avec l'événement onBlur si nécessaire.
 * Pour cela, il faut déconstruire Formik pour récupérer handleBlur et le donner à l'input.
 */
const FormikInput = (props: FormFieldProps) => (
  <FormikField {...props} component={InputField} />
);

export default FormikInput;

const InputField = ({
  field,
  form,
  ...props
}: FormikInputProps & FieldProps) => {
  const errorMessage = (form.errors as Record<string, string | undefined>)[
    field.name
  ];
  const isTouched = form.touched[field.name];
  const isError = errorMessage && isTouched;
  const inputType = props.type ?? 'text';

  return (
    <Field
      title={props.label}
      hint={props.hint}
      htmlFor={field.name}
      message={isError ? errorMessage : undefined}
      state={isError ? 'error' : 'default'}
      className={props.className}
    >
      {inputType === 'text' && (
        <Input
          {...field}
          {...props}
          id={field.name}
          type={inputType}
          maxLength={props.maxLength}
          onKeyDown={preventSubmit}
          state={isError ? 'error' : 'default'}
        />
      )}
      {inputType === 'password' && (
        <Input
          {...field}
          {...props}
          id={field.name}
          type={inputType}
          maxLength={props.maxLength}
          state={isError ? 'error' : 'default'}
        />
      )}
      {inputType === 'area' && (
        <Textarea
          {...field}
          {...props}
          id={field.name}
          state={isError ? 'error' : 'default'}
          className={classNames('min-h-[4rem]', props.inputClassName)}
        />
      )}
    </Field>
  );
};
