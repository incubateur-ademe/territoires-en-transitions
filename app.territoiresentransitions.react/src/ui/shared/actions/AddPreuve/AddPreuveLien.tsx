/**
 * Pertmet d'ajouter un lien comme preuve
 */

import {ChangeEvent, FormEvent, useState} from 'react';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import {preuveLienWriteEndpoint} from 'core-logic/api/endpoints/PreuveLienWriteEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer} from 'ui/shared/Spacer';
import {TActionPreuvePanelProps} from '../ActionPreuvePanel/ActionPreuvePanel';

export type TAddPreuveLienProps = TActionPreuvePanelProps & {
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
  const {onClose, action} = props;

  const collectivite_id = useCollectiviteId();

  const onSubmit = ({titre, url}: TPreuveLienParams) => {
    //TODO: insérer l'appel à preuveLienWrite ici
    console.log({
      action_id: action.id,
      collectivite_id,
      titre,
      url,
      commentaire: '',
    });
    //.then(onClose)
  };

  return (
    <Formik<TPreuveLienParams>
      initialValues={initialData}
      validationSchema={validation}
      onSubmit={onSubmit}
    >
      {({isValid}) => {
        return (
          <Form>
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
            <button className="fr-btn mt-2" disabled={!isValid} type="submit">
              Ajouter
            </button>
          </Form>
        );
      }}
    </Formik>
  );
};
