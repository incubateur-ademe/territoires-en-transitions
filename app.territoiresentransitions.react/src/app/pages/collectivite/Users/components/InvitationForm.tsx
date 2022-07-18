import {useMemo, useState} from 'react';
import {Field, FieldAttributes, FieldProps, Form, Formik} from 'formik';
import * as Yup from 'yup';
import {v4 as uuid} from 'uuid';
import classNames from 'classnames';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import InvitationMessage from './InvitationMessage';

type InvitationFormProps = {
  currentUser: {nom: string; prenom: string; email: string; acces: string};
  currentCollectivite: CurrentCollectivite;
};

const InvitationForm = ({
  currentUser,
  currentCollectivite,
}: InvitationFormProps) => {
  const [acces, setAcces] = useState<string | undefined>(undefined);

  const validationInvitation = Yup.object({
    email: Yup.string()
      .email('Format attendu : nom@domaine.fr')
      .required('Ce champ est obligatoire'),
    acces: Yup.string().required('Ce champ est obligatoire'),
  });

  const fakeAccesOptions = useMemo(() => {
    const adminOption = {value: 'admin', label: 'Admin'};
    const editionOptions = [
      {
        value: 'edition',
        label: 'Édition',
      },
      {
        value: 'lecture',
        label: 'Lecture',
      },
    ];
    if (currentUser.acces === 'admin') {
      return [adminOption, ...editionOptions];
    } else {
      return editionOptions;
    }
  }, [currentUser]);

  const onSubmitInvitation = (values: {email: string; acces: string}) => {
    setAcces(values.acces);
    console.log(values);
  };

  return (
    <div className="max-w-4xl">
      <Formik
        initialValues={{email: '', acces: ''}}
        validationSchema={validationInvitation}
        onSubmit={onSubmitInvitation}
      >
        <Form className="md:flex gap-6">
          <Field name="email" type="text" component={InvitationEmailInput} />
          <SelectField
            name="acces"
            label="Niveau d’accès pour cette collectivité"
            options={fakeAccesOptions}
          />
          <button type="submit" className="fr-btn md:mt-7 md:mb-auto">
            Ajouter
          </button>
        </Form>
      </Formik>
      {acces && (
        <InvitationMessage
          currentCollectivite={currentCollectivite}
          currentUser={currentUser}
          acces={acces}
        />
      )}
    </div>
  );
};

export default InvitationForm;

type Option = {
  value: string;
  label: string;
};

interface SelectFieldProps extends FieldAttributes<any> {
  label: string;
  options: Option[];
}

const SelectField = (props: SelectFieldProps) => (
  <Field {...props}>
    {({field, form}: {field: any; form: any}) => {
      const htmlId = uuid();
      const errorMessage = form.errors[field.name];
      const isTouched = form.touched[field.name];
      const isError = errorMessage && isTouched;

      return (
        <div
          className={classNames('fr-select-group md:flex-grow', {
            ['fr-select-group--error']: isError,
          })}
        >
          <label className="fr-label" htmlFor={htmlId}>
            {props.label}
          </label>
          <select
            className={classNames('fr-select', {
              ['fr-select--error']: isError,
            })}
            id={htmlId}
            {...field}
          >
            <option value="" disabled hidden>
              Selectionnez une option
            </option>
            {props.options.map((option: Option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isError && <p className="fr-error-text">{errorMessage}</p>}
        </div>
      );
    }}
  </Field>
);

type InvitationEmailInputProps = {
  type?: string;
};

const InvitationEmailInput = (
  props: InvitationEmailInputProps & FieldProps
) => {
  const htmlId = uuid();
  const errorMessage = props.form.errors[props.field.name];
  const isTouched = props.form.touched[props.field.name];
  const isError = errorMessage && isTouched;
  const inputType = props.type ?? 'text';

  return (
    <div
      className={classNames('fr-input-group md:flex-grow', {
        ['fr-input-group--error']: isError,
      })}
    >
      <label htmlFor={htmlId} className="fr-label">
        Adresse email de la personne à inviter
      </label>
      <input
        id={htmlId}
        type={inputType}
        className={classNames('fr-input', {['fr-input--error']: isError})}
        {...props.field}
      />
      {isError && <p className="fr-error-text">{errorMessage}</p>}
    </div>
  );
};
