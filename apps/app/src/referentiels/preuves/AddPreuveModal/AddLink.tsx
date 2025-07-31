/**
 * Affiche le formulaire d'ajout de liens
 */

import FormikInput from '@/app/ui/shared/form/formik/FormikInput';
import { Button } from '@/ui';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

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
  const { onClose, onAddLink } = props;

  const onSubmit = ({ titre, url }: TPreuveLienParams) => {
    onAddLink(titre, url);
    onClose();
  };

  return (
    <Formik<TPreuveLienParams>
      initialValues={initialData}
      validationSchema={validation}
      onSubmit={onSubmit}
    >
      {({ values, isValid }) => {
        return (
          <Form data-test="AddLink" className="flex flex-col gap-8">
            <div className="flex gap-6">
              <FormikInput
                name="titre"
                label="Titre (obligatoire)"
                className="w-[35%]"
              />
              <FormikInput
                name="url"
                label="Lien (obligatoire)"
                className="w-[65%]"
              />
            </div>
            <div className="flex gap-4 ml-auto">
              <Button variant="outlined" onClick={onClose}>
                Annuler
              </Button>
              <Button
                data-test="ok"
                disabled={!values.titre || !values.url || !isValid}
              >
                Ajouter
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};
