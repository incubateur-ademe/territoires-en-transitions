import {FicheActionInterface} from 'generated/models/fiche_action';
import React, {useState} from 'react';
import * as Yup from 'yup';
import {Field, Form, Formik} from 'formik';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {ActionsField} from 'app/pages/collectivite/PlanActions/Forms/ActionsField';
import {IndicateursField} from 'app/pages/collectivite/PlanActions/Forms/IndicateursField';
import {IndicateursPersonnalisesField} from 'app/pages/collectivite/PlanActions/Forms/IndicateursPersonnalisesField';
import {CategoriePicker} from 'app/pages/collectivite/PlanActions/Forms/CategoriePicker';

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
    epci_id: Yup.string().max(36).required(),
    uid: Yup.string().max(36).required(),
    custom_id: Yup.string().max(36).required(),
    avancement: Yup.string().max(36).required(),
    en_retard: Yup.boolean().required(),
    referentiel_action_ids: Yup.array(),
    referentiel_indicateur_ids: Yup.array(),
    titre: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    description: Yup.string(),
    budget: Yup.number(),
    personne_referente: Yup.string().max(
      100,
      'Ce champ doit faire au maximum 100 caractères'
    ),
    structure_pilote: Yup.string().max(
      300,
      'Ce champ doit faire au maximum 300 caractères'
    ),
    partenaires: Yup.string().max(
      300,
      'Ce champ doit faire au maximum 300 caractères'
    ),
    elu_referent: Yup.string().max(
      300,
      'Ce champ doit faire au maximum 300 caractères'
    ),
    commentaire: Yup.string(),
    date_debut: Yup.date(),
    date_fin: Yup.date(),
    indicateur_personnalise_ids: Yup.array(),
  });

  const save = (data: FicheActionInterface) => {
    console.log(data);
    if (state !== 'ready') return;
    setState('saving');
    props.onSave(data);
  };

  return (
    <Formik<FicheActionInterface>
      initialValues={props.fiche}
      validationSchema={validation}
      onSubmit={save}
    >
      {() => (
        <Form onKeyDown={onKeyDown}>
          <div className="max-w-2xl">
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

            <div className="max-w-xl">
              <CategoriePicker ficheUid={props.fiche.uid} />
            </div>
            <div className="p-5" />

            <Field
              name="description"
              label="Description"
              type="area"
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

            <fieldset className="flex flex-row">
              <div className="flex flex-col mr-5">
                <label className="fr-label mb-2" htmlFor="fiche_create_debut">
                  Date de début
                </label>
                <Field
                  name="date_debut"
                  type="date"
                  className="fr-input bg-beige p-3 border-b-2 border-gray-500"
                />
              </div>

              <div className="flex flex-col mr-5">
                <label className="fr-label mb-2" htmlFor="fiche_create_debut">
                  Date de début
                </label>
                <Field
                  name="date_fin"
                  type="date"
                  className="fr-input bg-beige p-3 border-b-2 border-gray-500"
                />
              </div>
            </fieldset>
            <div className="p-5" />
          </div>

          <Field
            name="referentiel_action_ids"
            label="Actions du référentiel"
            component={ActionsField}
          />
          <span className="bg-yellow-400">todo cartes actions</span>
          <div className="p-5" />

          <Field
            name="referentiel_indicateur_ids"
            label="Indicateurs du référentiel"
            component={IndicateursField}
          />
          <span className="bg-yellow-400">todo cartes indicateurs</span>
          <div className="p-5" />

          <Field
            name="indicateur_personnalise_ids"
            label="Indicateurs personnalisés"
            component={IndicateursPersonnalisesField}
          />
          <button className="bg-yellow-400">todo créer un indicateur</button>
          <span className="bg-yellow-400">todo cartes indicateurs perso</span>
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
      )}
    </Formik>
  );
};
