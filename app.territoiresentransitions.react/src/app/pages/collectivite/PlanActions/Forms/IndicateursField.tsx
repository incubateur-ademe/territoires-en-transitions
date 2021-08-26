import React, {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {indicateurs} from 'generated/data/indicateurs_referentiels';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {indicateurToEmoji} from 'app/pages/collectivite/PlanActions/Forms/toEmoji';

const indicateursById = () => {
  const results = new Map<string, IndicateurReferentiel>();
  indicateurs.forEach(indicateur => results.set(indicateur.id, indicateur));
  return results;
};

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
export const IndicateursField: FC<IndicateursFieldProps & FieldProps> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];
  const allIndicateurs = indicateursById();

  const allIndicateurIds = indicateurs
    .map(indicateur => indicateur.id)
    .sort((a, b) => a.localeCompare(b));

  return (
    <fieldset className="block">
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={allIndicateurIds}
        className="bg-beige list-none"
        renderOption={id => {
          const indicateur = allIndicateurs.get(id)!;
          return `${indicateurToEmoji(indicateur)} ${indicateur.id} - ${
            indicateur.nom
          }`;
        }}
        getOptionLabel={id => {
          const indicateur = allIndicateurs.get(id)!;
          return `${indicateurToEmoji(indicateur)} ${indicateur.id}`;
        }}
        value={field.value}
        onChange={(e, value) => {
          setFieldValue(field.name, value);
        }}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label={props.label}
            placeholder={props.label}
          />
        )}
      />
    </fieldset>
  );
};
