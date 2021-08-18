import {FicheActionInterface} from 'generated/models/fiche_action';
import React, {FC, useState} from 'react';
import * as Yup from 'yup';
import {Field, FieldProps, Form, Formik} from 'formik';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {v4 as uuid} from 'uuid';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import {ActionReferentiel} from 'generated/models/action_referentiel';

type FicheActionFormProps = {
  fiche: FicheActionInterface;
  onSave: (fiche: FicheActionInterface) => void;
};

type FormState = 'ready' | 'saving';

/**
 * Prevents enter key submitting the form.
 */
function onKeyDown(event: React.KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
}

type TagsFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};

type ActionsTagsFieldProps = {
  selected: ActionReferentiel[];
};

const top100Films = [
  {title: 'The Shawshank Redemption', year: 1994},
  {title: 'The Godfather', year: 1972},
  {title: 'The Godfather: Part II', year: 1974},
  {title: 'The Dark Knight', year: 2008},
  {title: '12 Angry Men', year: 1957},
  {title: "Schindler's List", year: 1993},
  {title: 'Pulp Fiction', year: 1994},
];

/**
 * A material UI
 */
const ActionsTagsField: FC<
  ActionsTagsFieldProps & TagsFieldProps & FieldProps
> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors},
  ...props
}) => {
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];

  return (
    <fieldset>
      <h3>yolo dodo</h3>
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={top100Films}
        getOptionLabel={option => option.title}
        defaultValue={[top100Films[3]]}
        renderInput={params => (
          <TextField
            {...params}
            variant="standard"
            label={props.label}
            placeholder={props.label}
          />
        )}
      />
    </fieldset>
  );
};

/**
 * Used to edit a fiche.
 *
 * This form have two usages:
 * - edition via FicheActionEditor
 * - creation via FicheActionCreator
 *
 * @param props used to pass the data.
 */
export const FicheActionForm = (props: FicheActionFormProps) => {
  const [state, setState] = useState<FormState>('ready');

  const validation = Yup.object({
    titre: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
    nom: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    prenom: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    vie_privee_conditions: Yup.boolean().isTrue('Champ requis'),
  });

  const save = (data: FicheActionInterface) => {
    console.log(data);

    // if (state !== 'ready') return;
    // setState('saving');
    // props.onSave(data);
  };

  return (
    <Formik<FicheActionInterface>
      initialValues={props.fiche}
      // validationSchema={validation}
      onSubmit={save}
    >
      {() => (
        <Form onKeyDown={onKeyDown}>
          <Field
            name="custom_id"
            label="Numérotation de l'action"
            hint="ex: 1.2.3, A.1.a, 1.1 permet le classement"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <Field
            name="titre"
            label="Titre"
            hint="Ce champ est requis"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <Field
            name="description"
            label="Description"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <label>
            <Field type="checkbox" name="en_retard" />
            Action en retard
          </label>
          <div className="p-5" />

          <Field
            name="structure_pilote"
            label="Structure pilote"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <Field
            name="personne_referente"
            label="Personne référente"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <Field
            name="elu_referent"
            label="Élu référent"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <Field
            name="partenaires"
            label="Partenaires"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <Field
            name="budget"
            label="Budget global"
            hint="Ce champ ne doit comporter que des chiffres sans espaces"
            component={LabeledTextField}
          />
          <div className="p-5" />

          <fieldset>
            <div className="calendar">
              <div>
                <label className="fr-label" htmlFor="fiche_create_debut">
                  Date de début
                </label>
                <Field name="date_debut" type="date" className="fr-input" />
              </div>

              <div>
                <label className="fr-label" htmlFor="fiche_create_debut">
                  Date de début
                </label>
                <Field name="date_fin" type="date" className="fr-input" />
              </div>
            </div>
          </fieldset>
          <div className="p-5" />

          <Field
            name="referentiel_action_ids"
            label="Actions du référentiel"
            component={ActionsTagsField}
          />
          <div className="p-5" />

          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  );
};
