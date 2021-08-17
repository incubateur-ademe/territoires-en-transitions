import {v4 as uuid} from 'uuid';
import {FC} from 'react';
import {FieldProps} from 'formik';

type LabeledTextInputProps = {
  label: string;
  id?: string;
  hint?: string;
  maxLength?: number;
};

/**
 * A text input with a label on top
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

  return (
    <fieldset>
      <label className="fr-label" htmlFor={htmlId}>
        {props.label}
        <slot />
      </label>

      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && <div className="hint">{errorMessage}</div>}

      <input
        id={htmlId}
        className="fr-input"
        maxLength={props.maxLength}
        {...field}
      />
    </fieldset>
  );
};

export default LabeledTextField;
