import {useState} from 'react';
import * as Yup from 'yup';
import {Field, Form, Formik} from 'formik';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import {ValiderButton} from 'ui/shared/ValiderButton';
import FormInput from 'ui/shared/form/FormInput';

type FormState = 'ready' | 'saving';

export const IndicateurPersonnaliseForm = (props: {
  indicateur: IndicateurPersonnaliseDefinitionWrite;
  onSave: (data: IndicateurPersonnaliseDefinitionWrite) => void;
}) => {
  const [state, setState] = useState<FormState>('ready');
  const validation = Yup.object({
    collectivite_id: Yup.number().required(),
    identifiant: Yup.string().max(36),
    titre: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required(),
    unite: Yup.string(),
    description: Yup.string(),
    commentaire: Yup.string(),
  });

  const save = (data: IndicateurPersonnaliseDefinitionWrite) => {
    if (state !== 'ready') return;
    setState('saving');
    props.onSave(data);
  };

    return (
      <Formik<IndicateurPersonnaliseDefinitionWrite>
        initialValues={props.indicateur}
        validationSchema={validation}
        onSubmit={save}
      >
        <Form>
          <Field name="titre" label="Titre" component={FormInput} />
          <Field
            type="area"
            name="description"
            label="Description"
            component={FormInput}
          />
          <Field name="unite" label="Unité" component={FormInput} />
          <Field
            type="area"
            name="commentaire"
            label="Commentaire"
            component={FormInput}
          />
          <div className="flex flex-row-reverse pt-5">
            {state === 'ready' && <ValiderButton />}
            {state === 'saving' && (
              <button className="fr-btn" type="submit" disabled>
                Enregistrement en cours...
              </button>
            )}
          </div>
        </Form>
      </Formik>
    );
};
