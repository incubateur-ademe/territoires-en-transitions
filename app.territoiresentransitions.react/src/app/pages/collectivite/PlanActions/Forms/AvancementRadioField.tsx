import {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';

import {Option, Options} from 'types';
import {ficheActionAvancementLabels} from 'app/labels';
import * as R from 'ramda';
import {Avancement} from 'generated/dataLayer/action_statut_read';
import {FicheActionAvancement} from 'generated/dataLayer/fiche_action_write';

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
  ({field, form: {setFieldValue}, ...props}) => {
    const htmlId = props.id ?? uuid();

    const avancements: Options<FicheActionAvancement> = R.values(
      R.mapObjIndexed(
        (label, value) => ({value, label}),
        ficheActionAvancementLabels
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
