import {v4 as uuid} from 'uuid';
import {FC} from 'react';
import {FieldProps} from 'formik';

type LabeledTextInputProps = {
  label: string;
  id?: string;
  hint?: string;
  maxLength?: number;
  type?: 'area' | 'text';
};

/**
 * A text input with a label on top, to be used with Formik.
 *
 * One can use the label prop to display an _unstyled_ text on top of the textarea.
 * In order to style the label text, a child element should be passed instead.
 */
const LabeledTextField: FC<LabeledTextInputProps & FieldProps> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors},
  ...props
}) => {
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];

  return (
    <div className="max-w-xl">
      <label className="fr-label" htmlFor={htmlId}>
        {props.label}
        <slot />
      </label>

      {!errorMessage && props.hint && (
        <div className="mt-2 text-sm opacity-80">{props.hint}</div>
      )}
      {errorMessage && isTouched && (
        <div className="mt-2 text-sm opacity-80">{errorMessage}</div>
      )}

      {props.type !== 'area' && (
        <input
          id={htmlId}
          className="fr-input mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
          maxLength={props.maxLength}
          {...field}
        />
      )}

      {props.type === 'area' && (
        <textarea
          id={htmlId}
          className="fr-input mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
          maxLength={props.maxLength}
          {...field}
        />
      )}
    </div>
  );
};

export default LabeledTextField;
