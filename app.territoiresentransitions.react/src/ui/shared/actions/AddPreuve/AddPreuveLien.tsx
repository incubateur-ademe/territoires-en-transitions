/**
 * Pertmet d'ajouter un lien comme preuve
 */

import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer} from 'ui/shared/Spacer';

export type TAddLink = (titre: string, url: string) => Promise<boolean>;

export type TAddPreuveLienProps = {
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

export const AddPreuveLien = (props: TAddPreuveLienProps) => {
  const {onClose, onAddLink} = props;

  const onSubmit = ({titre, url}: TPreuveLienParams) => {
    onAddLink(titre, url).then(onClose);
  };

  return (
    <Formik<TPreuveLienParams>
      initialValues={initialData}
      validationSchema={validation}
      onSubmit={onSubmit}
    >
      {({values, isValid}) => {
        return (
          <Form data-test="AddPreuveLien">
            <div className="fr-form-group">
              <fieldset className="fr-fieldset">
                <div className="fr-fieldset__content"></div>
                <Field
                  name="titre"
                  label="Titre (obligatoire)"
                  component={LabeledTextField}
                />
                <Spacer size={2} />
                <Field
                  name="url"
                  label="Lien (obligatoire)"
                  component={LabeledTextField}
                />
              </fieldset>
            </div>
            <button
              className="fr-btn mt-2"
              disabled={!values.titre || !values.url || !isValid}
              type="submit"
            >
              Ajouter
            </button>
          </Form>
        );
      }}
    </Formik>
  );
};
