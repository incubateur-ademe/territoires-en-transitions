import React, {useEffect, useState} from 'react';
import * as Yup from 'yup';
import {Field, Form, Formik, useFormikContext} from 'formik';
import {ActionsField} from 'app/pages/collectivite/PlanActions/Forms/ActionsField';
import {IndicateursField} from 'app/pages/collectivite/PlanActions/Forms/IndicateursField';
import {IndicateursPersonnalisesField} from 'app/pages/collectivite/PlanActions/Forms/IndicateursPersonnalisesField';
import {Spacer} from 'ui/shared/Spacer';
import {IndicateurPersonnaliseCreationDialog} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCreationDialog';
import {AvancementRadioField} from 'app/pages/collectivite/PlanActions/Forms/AvancementRadioField';
import {PlanCategoriesSelectionField} from 'app/pages/collectivite/PlanActions/Forms/PlanCategoriesSelectionField';
import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCard';
import {IndicateurReferentielCard} from 'app/pages/collectivite/Indicateurs/IndicateurReferentielCard';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {useIndicateurPersonnaliseDefinitionList} from 'core-logic/hooks/indicateur_personnalise_definition';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {useAllIndicateurDefinitions} from 'core-logic/hooks/indicateur_definition';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useActionTitleList} from 'core-logic/hooks/referentiel';
import {ExpensiveActionReferentielAvancementCard} from 'ui/referentiels/ExpensiveActionReferentielAvancementCard';
import FormInput from 'ui/shared/form/FormInput';

/**
 * Stores both plan and category uid, represents the user's selection of a
 * category in a plan. The category is optional as a fiche can be
 * uncategorized inside a plan.
 */
export interface PlanCategorieSelection {
  categorieUid?: string;
  planUid: string;
}

/**
 * Represent the user's categories selection as a fiche can belong to many
 * plans.
 */
export interface planCategorieSelections {
  planCategories: PlanCategorieSelection[];
}

/**
 * Join categories data with fiche data as the form data that will be saved.
 */
export type FicheActionFormData = planCategorieSelections & FicheActionWrite;

type FicheActionFormProps = {
  fiche: FicheActionWrite;
  planCategories: PlanCategorieSelection[];
  onSave: (data: FicheActionFormData) => void;
};

type FormState = 'ready' | 'saving';

const LinkedActionsReferentielCards = () => {
  const {values} = useFormikContext<FicheActionRead>();
  const titles = useActionTitleList('all');

  const linkedTitles = titles.filter(title =>
    values.action_ids.includes(title.id)
  );

  return (
    <div>
      {linkedTitles.map(title => (
        <ExpensiveActionReferentielAvancementCard
          key={title.id}
          title={title}
        />
      ))}
    </div>
  );
};

const useFicheActionLinkedIndicateurDefinitions = (
  linkedIndicateurIds: string[]
) => {
  const [linkedIndicateurDefinitions, setLinkedIndicateurDefinitions] =
    useState<IndicateurDefinitionRead[]>([]);
  const allIndicateurDefinitions = useAllIndicateurDefinitions();

  useEffect(() => {
    const linkedIndicateurDefinitions = allIndicateurDefinitions.filter(
      indicateurefinition =>
        linkedIndicateurIds.includes(indicateurefinition.id)
    );

    setLinkedIndicateurDefinitions(
      linkedIndicateurDefinitions.filter(
        definition => !!definition
      ) as IndicateurDefinitionRead[]
    );
  }, [allIndicateurDefinitions.length, linkedIndicateurIds.length]);
  return linkedIndicateurDefinitions;
};

const LinkedIndicateurCards = () => {
  const {values} = useFormikContext<FicheActionRead>();
  const linkedIndicateurDefinitions: IndicateurDefinitionRead[] =
    useFicheActionLinkedIndicateurDefinitions(values.indicateur_ids);
  return (
    <div>
      {linkedIndicateurDefinitions.map(definition => {
        if (definition)
          return (
            <IndicateurReferentielCard
              definition={definition}
              key={definition.id}
            />
          );
        return <i>indicateur manquant</i>;
      })}
    </div>
  );
};

const LinkedIndicateurPersonnaliseCards = () => {
  const collectivieId = useCollectiviteId()!;
  const indicateurPersonnalises: IndicateurPersonnaliseDefinitionRead[] =
    useIndicateurPersonnaliseDefinitionList(collectivieId);

  const {values} = useFormikContext<FicheActionRead>();
  const linkedIndicateursPersonnalises = values.indicateur_personnalise_ids
    .map(indicateurId =>
      indicateurPersonnalises.find(indicateur => indicateur.id === indicateurId)
    )
    .filter(Boolean); // filtre les entrées vides

  return (
    <div className="flex flex-col justify-between mt-6">
      {linkedIndicateursPersonnalises.map(indicateur => {
        if (indicateur)
          return (
            <IndicateurPersonnaliseCard
              indicateur={indicateur}
              key={indicateur.id}
            />
          );
        return <></>;
      })}
    </div>
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
    // collectivite_id: Yup.string().max(36).required(),
    uid: Yup.string().max(36).required(),
    numerotation: Yup.string().max(36),
    avancement: Yup.string().max(36).required(),
    en_retard: Yup.boolean().required(),
    action_ids: Yup.array(),
    indicateur_ids: Yup.array(),
    titre: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    description: Yup.string(),
    budget_global: Yup.number()
      .transform(
        (value, originalValue) => (/\s/.test(originalValue) ? NaN : value) // disallow whitespaces
      )
      .typeError('Ce champ ne doit comporter que des chiffres sans espaces'),
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
    planCategories: Yup.array().min(
      1,
      "Une fiche doit être rattachée à au moins un plan d'action."
    ),
  });

  const save = (data: FicheActionFormData) => {
    if (state !== 'ready') return;
    setState('saving');
    props.onSave(data);
  };

  return (
    <Formik<FicheActionFormData>
      initialValues={{
        ...props.fiche,
        planCategories: props.planCategories,
      }}
      validationSchema={validation}
      onSubmit={save}
    >
      {() => (
        <Form className="fiche-action">
          <div className="max-w-2xl">
            <FormInput
              name="numerotation"
              label="Numérotation de l'action"
              hint="ex: 1.2.3, A.1.a, 1.1 permet le classement"
            />
            <FormInput name="titre" label="Titre *" hint="Champ requis" />
            <Spacer />
            <Field
              name="planCategories"
              label="plans d'action"
              ficheUid={props.fiche.uid}
              component={PlanCategoriesSelectionField}
            />
            <Spacer />
            <FormInput type="area" name="description" label="Description" />
            <Spacer />
            <Field
              name="avancement"
              label="Avancement"
              component={AvancementRadioField}
            />
            <Spacer />
            <label>
              <Field type="checkbox" name="en_retard" />
              <span className="ml-2">Action en retard</span>
            </label>
            <Spacer />

            <FormInput name="structure_pilote" label="Structure pilote" />
            <Spacer />
            <FormInput name="personne_referente" label="Personne référente" />
            <Spacer />
            <FormInput name="elu_referent" label="Élu référent" />
            <Spacer />

            <FormInput name="partenaires" label="Partenaires" />
            <Spacer />

            <FormInput
              name="budget_global"
              label="Budget global"
              hint="Ce champ ne doit comporter que des chiffres sans espaces"
            />
            <Spacer />
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
                  Date de fin
                </label>
                <Field
                  name="date_fin"
                  type="date"
                  className="fr-input bg-beige p-3 border-b-2 border-gray-500"
                />
              </div>
            </fieldset>
            <Spacer />
          </div>

          <Field
            name="action_ids"
            label="Actions des référentiels liées"
            component={ActionsField}
          />
          <LinkedActionsReferentielCards />

          <Spacer />

          <Field
            name="indicateur_ids"
            label="Indicateurs des référentiels liés"
            component={IndicateursField}
          />
          <LinkedIndicateurCards />

          <Spacer />

          <Field
            name="indicateur_personnalise_ids"
            label="Indicateurs personnalisés liés"
            component={IndicateursPersonnalisesField}
          />

          <Spacer size={2} />

          <IndicateurPersonnaliseCreationDialog buttonClasses="fr-btn--secondary" />

          <LinkedIndicateurPersonnaliseCards />

          <div className="flex flex-row-reverse mb-12">
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
