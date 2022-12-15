import {v4 as uuid} from 'uuid';
import {ChangeEventHandler, FocusEventHandler} from 'react';

type LabeledTextInputProps = {
  label: string;
  value?: string;
  maxLength?: number;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;

  maxlength?: number;
  id?: string;
  hint?: string;
  errorMessage?: string;
  type?: 'area' | 'text';
};

/**
 * A text input with a label on top
 *
 * One can use the label prop to display an _unstyled_ text on top of the textarea.
 * In order to style the label text, a child element should be passed instead.
 */
export const LabeledTextInput = (props: LabeledTextInputProps) => {
  const htmlId = props.id ?? uuid();

  return (
    <div className="w-full">
      <label className="fr-label" htmlFor={htmlId}>
        {props.label}
        <slot />
      </label>

      {!props.errorMessage && props.hint && (
        <div className="mt-2 text-sm opacity-80">{props.hint}</div>
      )}
      {props.errorMessage && (
        <div className="mt-2 text-sm opacity-80">{props.errorMessage}</div>
      )}
      {props.type !== 'area' && (
        <input
          id={htmlId}
          className="fr-input mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
          value={props.value}
          maxLength={props.maxLength}
          onChange={props.onChange}
          onBlur={props.onChange}
        />
      )}
      {props.type === 'area' && (
        <textarea
          id={htmlId}
          className="fr-input mt-2 w-full bg-beige p-3 border-b-2 border-gray-500"
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onChange}
        />
      )}
    </div>
  );
};
