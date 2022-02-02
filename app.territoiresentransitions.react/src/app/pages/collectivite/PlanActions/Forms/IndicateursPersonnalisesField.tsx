import {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {shortenLabel} from 'app/pages/collectivite/PlanActions/Forms/utils';
import {compareIndexes} from 'utils/compareIndexes';
import {useIndicateurPersonnaliseDefinitionList} from 'core-logic/hooks/indicateur_personnalise_definition';
import {useCollectiviteId} from 'core-logic/hooks/params';

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
  const collectiviteId = useCollectiviteId()!;
  const indicateursPersoDefs =
    useIndicateurPersonnaliseDefinitionList(collectiviteId);

  const allSortedIndicateurIds = [...indicateursPersoDefs.entries()]
    .sort((a, b) => compareIndexes(a[1].titre, b[1].titre))
    .map(entry => entry[1].id);

  const renderIndicateurOption = (id: number) => {
    const indicateur = indicateursPersoDefs.find(
      indicateurPersoDef => indicateurPersoDef.id === id
    );
    return indicateur ? indicateur.titre : '...';
  };
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
        options={allSortedIndicateurIds}
        className="bg-beige"
        renderOption={id => renderIndicateurOption(id)}
        getOptionLabel={id => shortenLabel(renderIndicateurOption(id))}
        value={field.value as number[]}
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
