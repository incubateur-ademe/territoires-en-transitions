import {IndicateurPersonnaliseInterface} from 'generated/models/indicateur_personnalise';
import React, {useState} from 'react';
import * as Yup from 'yup';
import {Field, Form, Formik} from 'formik';
import LabeledTextField from 'ui/forms/LabeledTextField';

type FormState = 'ready' | 'saving';

/**
 * Prevents enter key submitting the form.
 */
function onKeyDown(event: React.KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
}

export function IndicateurPersonnaliseForm(props: {
  indicateur: IndicateurPersonnaliseInterface;
  onSave: (data: IndicateurPersonnaliseInterface) => void;
}) {
  const [state, setState] = useState<FormState>('ready');
  const validation = Yup.object({
    epci_id: Yup.string().max(36).required(),
    uid: Yup.string().max(36).required(),
    custom_id: Yup.string().max(36),
    nom: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required(),
    description: Yup.string(),
    meta: Yup.object({
      commentaire: Yup.string(),
    }),
  });

  const save = (data: IndicateurPersonnaliseInterface) => {
    console.log(data);
    if (state !== 'ready') return;
    setState('saving');
    props.onSave(data);
  };

  return (
    <Formik<IndicateurPersonnaliseInterface>
      initialValues={props.indicateur}
      validationSchema={validation}
      onSubmit={save}
    >
      <Form onKeyDown={onKeyDown} onSubmit={e => e.preventDefault()}>
        <Field name="nom" label="Titre" component={LabeledTextField} />
        <div className="p-5" />

        <Field
          name="description"
          label="Description"
          type="area"
          component={LabeledTextField}
        />

        <Field name="unite" label="Unité" component={LabeledTextField} />
        <div className="p-5" />

        <Field
          name="meta.commentaire"
          label="Commentaire"
          type="area"
          component={LabeledTextField}
        />
        <div className="p-5" />

        <div className="flex flex-row-reverse">
          {state === 'ready' && (
            <button className="fr-btn" type="submit">
              Enregistrer
            </button>
          )}
          {state === 'saving' && (
            <button className="fr-btn" type="submit" disabled>
              Enregistrement en cours...
            </button>
          )}
        </div>
      </Form>
    </Formik>
  );
}
