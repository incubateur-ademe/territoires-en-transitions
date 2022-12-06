import classNames from 'classnames';
import {Field, FieldAttributes, FieldProps} from 'formik';

import FormField from 'ui/shared/form/FormField';

type HTMLSelectOption = string | number | readonly string[] | undefined;

export type SelectOption<T> = {
  value: T;
  label: string;
};

type FormikSelectProps<T> = {
  label: string;
  hint?: string;
  disabled?: boolean;
  options: SelectOption<T>[];
};

type FormFieldProps<T = unknown> = FieldAttributes<FormikSelectProps<T>>;

/**
 * Select field à utiliser dans un formulaire Formik.
 */
const FormikSelect = (props: FormFieldProps) => (
  <Field {...props} component={SelectField} />
);

const SelectField = ({
  field,
  form,
  ...props
}: FormikSelectProps<unknown> & FieldProps) => {
  const errorMessage = (form.errors as Record<string, string | undefined>)[
    field.name
  ];
  const isTouched = (form.touched as Record<string, boolean | undefined>)[
    field.name
  ];
  const isError = errorMessage && isTouched;

  return (
    <FormField
      label={props.label}
      hint={props.hint}
      htmlFor={props.label}
      errorMessage={isError ? errorMessage : undefined}
    >
      <select
        className={classNames('fr-select', {
          'fr-select--error': isError,
        })}
        id={props.label}
        {...field}
        {...props}
      >
        <option value="" disabled hidden>
          Sélectionnez une option
        </option>
        {props.options.map(option => (
          <option
            key={option.value as string}
            value={option.value as HTMLSelectOption}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export default FormikSelect;
