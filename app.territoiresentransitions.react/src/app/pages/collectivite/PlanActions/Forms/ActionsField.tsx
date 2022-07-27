import {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {useActionTitleList} from 'core-logic/hooks/referentiel';
import {shortenLabel} from 'app/pages/collectivite/PlanActions/Forms/utils';

type ActionsFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};

/**
 * A material UI tags field (multi picker) for action ids.
 */
export const ActionsField: FC<ActionsFieldProps & FieldProps> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];
  const titles = useActionTitleList('all');

  // don't display anything if data are not available...
  if (!titles?.length) {
    return null;
  }

  const allActionIds = titles
    .filter(title => title.type !== 'referentiel')
    .map(title => title.id);
  const renderActionOption = (actionId: string) => {
    const title = titles.find(title => title.id === actionId)!;
    return `${title.referentiel} ${title.identifiant} - ${title.nom}`;
  };

  return (
    <fieldset>
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={allActionIds}
        className="bg-beige"
        renderOption={renderActionOption}
        getOptionLabel={id => shortenLabel(renderActionOption(id))}
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
