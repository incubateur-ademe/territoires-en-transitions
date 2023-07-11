import classNames from 'classnames';
import * as Yup from 'yup';
import {Form, Formik} from 'formik';
import FormikInput from 'ui/shared/form/formik/FormikInput';
import {TIndicateurPersoDefinitionWrite} from './useUpsertIndicateurPersoDefinition';

const validation = Yup.object({
  titre: Yup.string()
    .max(300, 'Ce champ doit faire au maximum 300 caractères')
    .required('Un titre est requis'),
  unite: Yup.string(),
  description: Yup.string(),
});

/** Affiche le formulaire de création d'un indicateur personnalisé */
export const IndicateurPersoNouveauForm = (props: {
  indicateur: TIndicateurPersoDefinitionWrite;
  isSaving?: boolean;
  onSave: (data: TIndicateurPersoDefinitionWrite) => void;
  onCancel?: () => void;
}) => {
  const {indicateur, isSaving, onSave, onCancel} = props;

  return (
    <Formik<TIndicateurPersoDefinitionWrite>
      initialValues={indicateur}
      validationSchema={validation}
      onSubmit={onSave}
    >
      <Form>
        <div className="bg-grey975 fr-py-7w fr-px-10w">
          <p>
            Les indicateurs personnalisés vous permettent de suivre de manière
            spécifique les actions menées par votre collectivité. Associez-les à
            une ou plusieurs fiches action pour faciliter leur mise à jour !
          </p>
          <FormikInput name="titre" label="Nom de l’indicateur" />
          <FormikInput name="unite" label="Unité" />
          <FormikInput type="area" name="description" label="Description" />
        </div>
        <div className="flex flex-row justify-end gap-4 pt-5">
          {onCancel && (
            <button className="fr-btn fr-btn--secondary" onClick={onCancel}>
              Annuler
            </button>
          )}
          <button
            type="submit"
            className={classNames('fr-btn', {
              'fr-btn--icon-right fr-icon-arrow-right-line': !isSaving,
            })}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement en cours...' : 'Valider et compléter'}
          </button>
        </div>
      </Form>
    </Formik>
  );
};
