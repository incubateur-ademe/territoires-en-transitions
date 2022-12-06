import {useMemo, useRef, useState} from 'react';
import {Form, Formik, FormikProps} from 'formik';
import * as Yup from 'yup';
import {UserData} from 'core-logic/api/auth/AuthProvider';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import InvitationMessage from 'app/pages/collectivite/Users/components/InvitationMessage';
import {NiveauAcces} from 'generated/dataLayer';
import {
  AddUserToCollectiviteRequest,
  AddUserToCollectiviteResponse,
} from 'app/pages/collectivite/Users/useAddUserToCollectivite';
import FormikInput from 'ui/shared/form/formik/FormikInput';
import FormikSelect from 'ui/shared/form/formik/FormikSelect';

type AccesOption = {
  value: NiveauAcces;
  label: string;
};

type FormProps = {email: string; acces: '' | NiveauAcces};

type InvitationFormProps = {
  currentUser: UserData;
  currentCollectivite: CurrentCollectivite;
  addUser: (request: AddUserToCollectiviteRequest) => void;
  addUserResponse: AddUserToCollectiviteResponse | null;
  resetAddUser: () => void;
};

const InvitationForm = ({
  currentUser,
  currentCollectivite,
  addUser,
  addUserResponse,
  resetAddUser,
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

  const formRef = useRef<FormikProps<FormProps>>(null);

  const [formIsFilling, setFormIsFilling] = useState(true);
  const [accesInvitationForm, setAccesInvitationForm] = useState<
    NiveauAcces | undefined
  >(undefined);

  const handleClearForm = () => {
    setFormIsFilling(true);
    resetAddUser();
    if (formRef.current) {
      formRef.current.handleReset();
    }
  };

  const onSubmitInvitation = (values: FormProps) => {
    if (values.acces) {
      const req: AddUserToCollectiviteRequest = {
        collectiviteId: currentCollectivite.collectivite_id,
        email: values.email,
        niveauAcces: values.acces,
      };
      addUser(req);
      setFormIsFilling(false);
      setAccesInvitationForm(values.acces);
    }
  };

  return (
    <div data-test="invitation-form" className="max-w-4xl">
      <Formik
        innerRef={formRef}
        initialValues={{email: '', acces: ''}}
        validationSchema={validationInvitation}
        onSubmit={onSubmitInvitation}
      >
        <Form
          className="md:flex gap-6"
          onChange={() => {
            setFormIsFilling(true);
            resetAddUser();
          }}
        >
          <FormikInput
            name="email"
            label="Adresse email de la personne à inviter"
          />
          <FormikSelect
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
      {!formIsFilling && accesInvitationForm && (
        <AddUserResponse
          addUserResponse={addUserResponse}
          currentCollectivite={currentCollectivite}
          currentUser={currentUser}
          handleClearForm={handleClearForm}
          acces={accesInvitationForm}
        />
      )}
    </div>
  );
};

const AddUserResponse = ({
  addUserResponse,
  currentCollectivite,
  currentUser,
  handleClearForm,
  acces,
}: {
  addUserResponse: AddUserToCollectiviteResponse | null;
  currentCollectivite: CurrentCollectivite;
  currentUser: UserData;
  handleClearForm: () => void;
  acces: NiveauAcces;
}) => {
  if (addUserResponse?.invitationUrl) {
    return (
      <InvitationMessage
        currentCollectivite={currentCollectivite}
        currentUser={currentUser}
        acces={acces}
        invitationUrl={addUserResponse.invitationUrl}
      />
    );
  } else if (addUserResponse?.added) {
    setTimeout(() => {
      handleClearForm();
    }, 5000);
    return (
      <div className="fr-alert fr-alert--success">
        Nouveau membre ajouté avec succès à la collectivité !
      </div>
    );
  } else if (addUserResponse?.error) {
    setTimeout(() => {
      handleClearForm();
    }, 5000);
    return (
      <div className="fr-alert fr-alert--info">{addUserResponse?.error}</div>
    );
  }
  return null;
};

export default InvitationForm;
