import {v4 as uuid} from 'uuid';
import React, {FC} from 'react';
import {FieldProps} from 'formik';

type LabeledTextInputProps = {
  label: string;
  id?: string;
  hint?: string;
  maxLength?: number;
  type?: 'area' | 'text' | 'password';
};

/**
 * Prevents enter key submitting the form.
 */
const preventSubmit = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
};

/**
 * A text input with a label on top, to be used with Formik.
 *
 * One can use the label prop to display an _unstyled_ text on top of the textarea.
 * In order to style the label text, a child element should be passed instead.
 */
const LabeledTextField: FC<LabeledTextInputProps & FieldProps> = ({
  field,
  form: {touched, errors},
  ...props
}) => {
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];
  const inputType = props.type ?? 'text';
  return (
    <div>
      <label className="fr-label" htmlFor={htmlId}>
        {props.label}
        <slot />
      </label>
      {!errorMessage && props.hint && (
        <div className="mt-2 text-sm opacity-80">{props.hint}</div>
      )}
      {errorMessage && isTouched && (
        <div className="mt-2 text-sm opacity-80 text-red-500">
          {errorMessage}
        </div>
      )}
      {inputType === 'password' && (
        <input
          type="password"
          id={htmlId}
          className="fr-input mt-2 w-full bg-red p-3 border-b-2 border-red-500"
          maxLength={props.maxLength}
          {...field}
          {...props}
        />
      )}
      {inputType === 'text' && (
        <>
          <input
            id={htmlId}
            className="fr-input mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
            maxLength={props.maxLength}
            onKeyDown={preventSubmit}
            {...field}
            {...props}
          />
        </>
      )}
      {inputType === 'area' && (
        <textarea
          id={htmlId}
          className="fr-input mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
          maxLength={props.maxLength}
          {...field}
          {...props}
        />
      )}
    </div>
  );
};

export default LabeledTextField;
