import React, {FC} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';

type LinkedPlanCategoriesFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};

/**
 * A material UI tags field (multi picker) for action ids.
 *
 * Could use generics.
 */
export const LinkedPlanCategoriesField: FC<
  LinkedPlanCategoriesFieldProps & FieldProps
> = ({
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
      {/* <Autocomplete
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
      /> */}
    </fieldset>
  );
};
