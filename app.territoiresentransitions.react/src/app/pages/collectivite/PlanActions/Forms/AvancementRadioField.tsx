import {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';
import {Avancement} from 'types';
import {Option, Options} from 'types';
import {fiche_action_avancement_noms} from 'generated/models/fiche_action_avancement_noms';
import * as R from 'ramda';

type AvancementRadioFieldProps = {
  id?: string;
  label: string;
};

/**
 * A material UI tags field (multi picker) for action ids.
 *
 * Could use generics.
 */
export const AvancementRadioField: FC<AvancementRadioFieldProps & FieldProps> =
  ({
    field, // { name, value, onChange, onBlur }
    form: {setFieldValue},
    ...props
  }) => {
    const htmlId = props.id ?? uuid();

    const filtered_fiche_action_avancement_noms = R.omit(
      ['non_concernee'],
      fiche_action_avancement_noms
    );
    const avancements: Options<Avancement> = R.values(
      R.mapObjIndexed(
        (label, value) => ({value, label}),
        filtered_fiche_action_avancement_noms // TODO : this should be renamed since it's used both by fiches & actions referentielles
      )
    );

    const optionIsChecked = ({option}: {option: Option<Avancement>}) =>
      field.value === option.value;
    const onClick = async ({option}: {option: Option<Avancement>}) => {
      setFieldValue(field.name, option.value);
    };

    return (
      <div>
        <label className="fr-label" htmlFor={htmlId}>
          {props.label}
          <slot />
        </label>
        <div className="pt-2">
          <AvancementRadioButton
            avancements={avancements}
            optionIsChecked={optionIsChecked}
            onClick={onClick}
          />
        </div>
      </div>
    );
  };
