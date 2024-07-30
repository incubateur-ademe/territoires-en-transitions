/**
 * Affiche le formulaire d'ajout de liens
 */

import {Form, Formik} from 'formik';
import * as Yup from 'yup';
import FormikInput from 'ui/shared/form/formik/FormikInput';

export type TAddLink = (titre: string, url: string) => void;

export type TAddLinkProps = {
  onAddLink: TAddLink;
  onClose: () => void;
};

type TPreuveLienParams = {
  titre: string;
  url: string;
};

const initialData: TPreuveLienParams = {
  titre: '',
  url: '',
};

const validation = Yup.object({
  titre: Yup.string().required('Merci de renseigner un titre pour ce lien '),
  url: Yup.string()
    .url('Merci de renseigner un lien valide')
    .required('Merci de renseigner un lien'),
});

export const AddLink = (props: TAddLinkProps) => {
  const {onClose, onAddLink} = props;

  const onSubmit = ({titre, url}: TPreuveLienParams) => {
    onAddLink(titre, url);
    onClose();
  };

  return (
    <Formik<TPreuveLienParams>
      initialValues={initialData}
      validationSchema={validation}
      onSubmit={onSubmit}
    >
      {({values, isValid}) => {
        return (
          <Form data-test="AddLink">
            <div className="fr-form-group flex flex-col gap-6">
              <FormikInput name="titre" label="Titre (obligatoire)" />
              <FormikInput name="url" label="Lien (obligatoire)" />
            </div>
            <button
              className="fr-btn fr-mt-2w"
              data-test="ok"
              disabled={!values.titre || !values.url || !isValid}
            >
              Ajouter
            </button>
          </Form>
        );
      }}
    </Formik>
  );
};
