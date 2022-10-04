import {useEffect, useState} from 'react';
import {Field, FieldAttributes, FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import classNames from 'classnames';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {useDebouncedCallback} from 'use-debounce';

/**
 * Prevents enter key submitting the form.
 */
const preventSubmit = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
};

export type Option<T extends string> = {
  value: T;
  label: string;
};

type FormSelectProps<T extends string> = {
  label: string;
  hint?: string;
  disabled?: boolean;
  isLoading?: boolean;
  options: Option<T>[];
  /**
   * Est nécessaire pour que Formik récupère la bonne valeur du field.
   * Doit être récupéré au niveau de la balise <Formik>
   */
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean | undefined
  ) => void;
  /** Exécute une action à la sélection d'une option */
  onSelectChange: (selected: T | undefined) => void;
  /** Exécute une action à chaque changement de l'input de recherche */
  onInputChange?: (inputValue: string) => void;
  /** Le délai à appliquer avant l'exécution du changement de l'input en ms  */
  inputDebounceDelay?: number;
};

type FormFieldProps<T extends string> = FieldAttributes<FormSelectProps<T>>;

/**
 * Auto complete input à utiliser dans un formulaire Formik.
 */
const FormAutoCompleteInput = <T extends string>(props: FormFieldProps<T>) => (
  <Field {...props} component={AutoCompleteInputField} />
);

export default FormAutoCompleteInput;

const AutoCompleteInputField = <T extends string>({
  field,
  form,
  ...props
}: FormSelectProps<T> & FieldProps) => {
  const errorMessage = (form.errors as Record<string, string | undefined>)[
    field.name
  ];
  const isTouched = (form.touched as Record<string, boolean | undefined>)[
    field.name
  ];
  const isError = errorMessage && isTouched;

  const htmlId = uuid();

  /**
   * Permet de profiter du debounce de l'input et d'afficher un text de chargement
   * quand l'utilisateur est entrain de faire une saisie.
   */
  const [isLoading, setIsLoading] = useState(props.isLoading);

  useEffect(() => setIsLoading(props.isLoading), [props.isLoading]);

  /**
   * Stockage de la valeur de l'input dans un state interne afin d'appliquer un debounce
   * à la fonction donner par le composant parent pouvant être une query.
   */
  const [inputValue, setInputValue] = useState('');

  // Fonction de debounce
  const handleInputChange = useDebouncedCallback(() => {
    if (props.onInputChange) {
      props.onInputChange(inputValue);
    }
    setIsLoading(false);
  }, props.inputDebounceDelay);

  // Application du debounce à chaque changement de valeur de l'input
  useEffect(() => handleInputChange(), [inputValue]);

  return (
    <div
      className={classNames('fr-select-group flex-grow', {
        ['fr-select-group--error']: isError,
        ['fr-select-group--disabled']: props.disabled,
      })}
    >
      <label className="fr-label" htmlFor={props.label}>
        {props.label}
        {props.hint && <span className="fr-hint-text">{props.hint}</span>}
      </label>
      <Autocomplete
        id={htmlId}
        fullWidth
        disablePortal
        disabled={props.disabled}
        loading={isLoading}
        loadingText="Chargement..."
        noOptionsText="Aucune option"
        options={props.options}
        getOptionLabel={option => option.label}
        getOptionSelected={(option, value) => option.value === value.value}
        onChange={(evt, newSelection) => {
          props.setFieldValue(field.name, newSelection?.value);
          props.onSelectChange(newSelection?.value);
        }}
        onInputChange={(event, newInputValue) => {
          setIsLoading(true);
          setInputValue(newInputValue);
        }}
        renderInput={params => (
          <div ref={params.InputProps.ref}>
            <input
              type="text"
              onKeyDown={preventSubmit}
              {...params.inputProps}
              className={classNames('fr-input', {
                ['fr-input--error']: isError,
              })}
            />
          </div>
        )}
      />
      {isError && <p className="fr-error-text">{errorMessage}</p>}
    </div>
  );
};
