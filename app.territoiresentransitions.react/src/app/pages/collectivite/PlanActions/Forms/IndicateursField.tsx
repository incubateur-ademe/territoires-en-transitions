import {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {indicateurs} from 'generated/data/indicateurs_referentiels';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {shortenLabel} from './utils';
import {
  indicateurIdRegexp,
  inferIndicateurReferentielAndTitle,
} from 'utils/indicateurs';

const indicateursById = () => {
  const results = new Map<string, IndicateurReferentiel>();
  indicateurs.forEach(indicateur => results.set(indicateur.id, indicateur));
  return results;
};

const sortIndicateurIds = (indicateursIds: string[]): string[] =>
  indicateursIds.sort((a, b) => {
    const a_groups = a.match(indicateurIdRegexp)?.groups;
    const b_groups = a.match(indicateurIdRegexp)?.groups;

    if (!a_groups || !b_groups) return a.localeCompare(b);
    const a_number = Number(a_groups['number']);
    const b_number = Number(b_groups['number']);

    if (a_number !== b_number) {
      return a_number > b_number ? 1 : -1;
    }

    return (a_groups['literal'] ?? '').localeCompare(b_groups['literal'] ?? '');
  });

const allIndicateurs = indicateursById();
const allIndicateurIds = indicateurs.map(indicateur => indicateur.id);
const allSortedIndicateurIds = [
  ...sortIndicateurIds(
    allIndicateurIds.filter(indicateurId => indicateurId.startsWith('cae'))
  ),
  ...sortIndicateurIds(
    allIndicateurIds.filter(indicateurId => indicateurId.startsWith('eci'))
  ),
];

const renderIndicateurOption = (id: string) => {
  const indicateur = allIndicateurs.get(id)!;
  return inferIndicateurReferentielAndTitle(indicateur);
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

  return (
    <fieldset className="block">
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={allSortedIndicateurIds}
        className="bg-beige list-none"
        renderOption={renderIndicateurOption}
        getOptionLabel={id => {
          return shortenLabel(renderIndicateurOption(id));
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
