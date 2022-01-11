import {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';

import {Option, Options} from 'types/componentSharedInterfaces';
import {
  ficheActionAvancementLabels,
  FicheActionAvancementRenseigne,
} from 'app/labels';
import * as R from 'ramda';
import {FicheAvancementRadioButton} from 'app/pages/collectivite/PlanActions/Forms/FicheAvancementRadioButton';

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

    const avancements: Options<FicheActionAvancementRenseigne> = R.values(
      R.mapObjIndexed(
        (label, value) => ({value, label}),
        ficheActionAvancementLabels
      )
    );

    const optionIsChecked = ({
      option,
    }: {
      option: Option<FicheActionAvancementRenseigne>;
    }) => field.value === option.value;
    const onClick = async ({
      option,
    }: {
      option: Option<FicheActionAvancementRenseigne>;
    }) => {
      if (field.value === option.value)
        setFieldValue(field.name, 'non_renseigne');
      else {
        setFieldValue(field.name, option.value);
      }
    };

    return (
      <div>
        <label className="fr-label" htmlFor={htmlId}>
          {props.label}
          <slot />
        </label>
        <div className="pt-2">
          <FicheAvancementRadioButton
            avancements={avancements}
            optionIsChecked={optionIsChecked}
            onClick={onClick}
          />
        </div>
      </div>
    );
  };
