import {alwaysValid, Validator} from "core-logic/api/validator";

import {v4 as uuid} from 'uuid'
import {useState} from "react";

type LabeledTextInputProps = {
    label: string;
    maxLength?: number;
    onChange: (value: string) => void;
    validator: Validator;
    maxlength: number | undefined;
    id: string | undefined;
    validateOnMount: boolean;
    hint: string;
    initialValue: String,
};

const labeledTextInputDefaultProps = {
    validator: alwaysValid,
    validateOnMount: true,
    initialValue: '',
    hint: '',
};

/**
 * A text input with a label on top
 *
 * One can use the label prop to display an _unstyled_ text on top of the textarea.
 * In order to style the label text, a child element should be passed instead.
 */
const LabeledTextInput = (props: LabeledTextInputProps) => {

    const htmlId = props.id ?? uuid();

    const [errorMessage, setErrorMessage] = useState<String | null>(
        props.validateOnMount ?
            props.validator(props.initialValue) :
            null
    );


    return (
        <fieldset>
            <label className="fr-label" htmlFor={htmlId}>
                {props.label}
                <slot/>
            </label>

            {(!errorMessage && props.hint) && <div className="hint">{props.hint}</div>}
            {errorMessage !== null && <div className="hint">{errorMessage}</div>}

            <input
                id={htmlId}
                className="fr-input"
                maxLength={props.maxLength}
                onChange={(e) => {
                    setErrorMessage(props.validator(e.target.value))
                    props.onChange(e.target.value);
                }}
            />
        </fieldset>
    );
};

LabeledTextInput.defaultProps = labeledTextInputDefaultProps;

export default LabeledTextInput;