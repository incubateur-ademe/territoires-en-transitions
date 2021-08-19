import React, {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {useAllStorablesAsMap} from 'core-logic/hooks/storables';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';

type IndicateursFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};
/**
 * A material UI tags field (multi picker) for action ids.
 *
 * Could use generics.
 */
export const IndicateursPersonnalisesField: FC<
  IndicateursFieldProps & FieldProps
> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const indicateurs = useAllStorablesAsMap<IndicateurPersonnaliseStorable>(
    indicateurPersonnaliseStore
  );
  const allIndicateurIds = [...indicateurs.keys()];

  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];

  return (
    <fieldset>
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={allIndicateurIds}
        getOptionLabel={id => {
          const indicateur = indicateurs.get(id)!;
          return `${
            indicateur.custom_id ? '(' + indicateur.custom_id + ') ' : ''
          } ${indicateur.nom}`;
        }}
        value={field.value as string[]}
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
