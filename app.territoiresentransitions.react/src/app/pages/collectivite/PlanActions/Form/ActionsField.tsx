import React, {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import {actionsById} from 'utils/actions';
import {actions} from 'generated/data/referentiels';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';

type ActionsFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};
/**
 * A material UI tags field (multi picker) for action ids.
 *
 * Could use generics.
 */
export const ActionsField: FC<ActionsFieldProps & FieldProps> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];
  const allActions = actionsById(actions);

  const allActionIds = [...allActions.keys()].sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <fieldset>
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={allActionIds}
        getOptionLabel={id => {
          const action = allActions.get(id)!;
          return `${action.id.startsWith('eco') ? '♻' : '🌍'} ${
            action.id_nomenclature
          }. ${action.nom}`;
        }}
        value={field.value}
        onChange={(e, value) => {
          setFieldValue(field.name, value);
        }}
        renderInput={params => (
          <TextField
            {...params}
            variant="standard"
            label={props.label}
            placeholder={props.label}
          />
        )}
      />
    </fieldset>
  );
};
