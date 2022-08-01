import {useMemo, useState} from 'react';
import {Field, FieldAttributes, FieldProps, Form, Formik} from 'formik';
import * as Yup from 'yup';
import {v4 as uuid} from 'uuid';
import classNames from 'classnames';
import {UserData} from 'core-logic/api/auth/AuthProvider';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import InvitationMessage from 'app/pages/collectivite/Users/components/InvitationMessage';
import {NiveauAcces} from 'generated/dataLayer';
import {
  AddUserToCollectiviteRequest,
  AddUserToCollectiviteResponse,
} from 'app/pages/collectivite/Users/useAddUserToCollectivite';

type AccesOption = {
  value: NiveauAcces;
  label: string;
};

type InvitationFormProps = {
  currentUser: UserData;
  currentCollectivite: CurrentCollectivite;
  addUser: (request: AddUserToCollectiviteRequest) => void;
  addUserResponse: AddUserToCollectiviteResponse | null;
};

const InvitationForm = ({
  currentUser,
  currentCollectivite,
  addUser,
  addUserResponse,
}: InvitationFormProps) => {
  const validationInvitation = Yup.object({
    email: Yup.string()
      .email('Format attendu : nom@domaine.fr')
      .required('Ce champ est obligatoire'),
    acces: Yup.string().required('Ce champ est obligatoire'),
  });

  const accesOptions: AccesOption[] = useMemo(() => {
    const adminOption: AccesOption = {value: 'admin', label: 'Admin'};
    const editionOptions: AccesOption[] = [
      {
        value: 'edition',
        label: 'Édition',
      },
      {
        value: 'lecture',
        label: 'Lecture',
      },
    ];
    if (currentCollectivite.niveau_acces === 'admin') {
      return [adminOption, ...editionOptions];
    } else {
      return editionOptions;
    }
  }, [currentCollectivite]);
  const [formIsFilling, setFormIsFilling] = useState(true);
  const onSubmitInvitation = (values: {
    email: string;
    acces: NiveauAcces | '';
  }) => {
    const req: AddUserToCollectiviteRequest = {
      collectiviteId: currentCollectivite.collectivite_id,
      email: values.email,
      niveauAcces: values.acces === '' ? 'lecture' : values.acces,
    };
    addUser(req);
    setFormIsFilling(false);
  };

  return (
    <div data-test="invitation-form" className="max-w-4xl">
      <Formik
        initialValues={{email: '', acces: ''}}
        validationSchema={validationInvitation}
        onSubmit={onSubmitInvitation}
      >
        <Form
          className="md:flex gap-6"
          onChange={() => {
            setFormIsFilling(true);
          }}
        >
          <Field name="email" type="text" component={InvitationEmailInput} />
          <SelectField
            name="acces"
            label="Niveau d’accès pour cette collectivité"
            options={accesOptions}
          />
          <button
            type="submit"
            className="fr-btn md:mt-7 md:mb-auto"
            disabled={!formIsFilling}
          >
            Ajouter
          </button>
        </Form>
      </Formik>
      {!formIsFilling && (
        <AddUserResponse
          addUserResponse={addUserResponse}
          currentCollectivite={currentCollectivite}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

const AddUserResponse = ({
  addUserResponse,
  currentCollectivite,
  currentUser,
}: {
  addUserResponse: AddUserToCollectiviteResponse | null;
  currentCollectivite: CurrentCollectivite;
  currentUser: UserData;
}) => {
  if (addUserResponse?.invitationUrl)
    return (
      <InvitationMessage
        currentCollectivite={currentCollectivite}
        currentUser={currentUser}
        acces={'edition'}
        invitationUrl={addUserResponse.invitationUrl}
      />
    );
  else if (addUserResponse?.added)
    return (
      <div className="fr-alert fr-alert--success">
        Nouveau membre ajouté avec succès à la collectivité !
      </div>
    );
  else if (addUserResponse?.error)
    return (
      <div className="fr-alert fr-alert--info">{addUserResponse?.error}</div>
    );
  return null;
};

export default InvitationForm;

interface SelectFieldProps extends FieldAttributes<any> {
  label: string;
  options: AccesOption[];
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
            {props.options.map((option: AccesOption) => (
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
