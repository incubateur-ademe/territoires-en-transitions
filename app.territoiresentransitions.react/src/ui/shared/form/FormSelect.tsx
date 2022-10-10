import classNames from 'classnames';
import {Field, FieldAttributes, FieldProps} from 'formik';

type HTMLSelectOption = string | number | readonly string[] | undefined;

export type SelectOption<T> = {
  value: T;
  label: string;
};

type FormSelectProps<T> = {
  label: string;
  hint?: string;
  disabled?: boolean;
  options: SelectOption<T>[];
};

type FormFieldProps<T = unknown> = FieldAttributes<FormSelectProps<T>>;

/**
 * Select field à utiliser dans un formulaire Formik.
 */
const FormSelect = (props: FormFieldProps) => (
  <Field {...props} component={SelectField} />
);

const SelectField = ({
  field,
  form,
  ...props
}: FormSelectProps<unknown> & FieldProps) => {
  const errorMessage = (form.errors as Record<string, string | undefined>)[
    field.name
  ];
  const isTouched = (form.touched as Record<string, boolean | undefined>)[
    field.name
  ];
  const isError = errorMessage && isTouched;

  return (
    <div
      className={classNames('fr-select-group flex-grow', {
        'fr-select-group--error': isError,
        'fr-select-group--disabled': props.disabled,
      })}
    >
      <label className="fr-label" htmlFor={props.label}>
        {props.label}
        {props.hint && <span className="fr-hint-text">{props.hint}</span>}
      </label>
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
      {isError && <p className="fr-error-text">{errorMessage}</p>}
    </div>
  );
};

export default FormSelect;
