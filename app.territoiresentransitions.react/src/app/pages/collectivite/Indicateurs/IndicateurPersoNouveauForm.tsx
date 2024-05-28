import {useState} from 'react';
import classNames from 'classnames';
import * as Yup from 'yup';
import {Form, Formik} from 'formik';
import FormikInput from 'ui/shared/form/formik/FormikInput';
import {TIndicateurPersoDefinitionWrite} from './useUpsertIndicateurPersoDefinition';
import FormField from 'ui/shared/form/FormField';
import {TThematiqueRow} from 'types/alias';
import ThematiquesDropdown from 'app/components/DropdownLists/ThematiquesDropdown';

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
  thematiquesFiche?: TThematiqueRow[] | null;
  onSave: (
    data: TIndicateurPersoDefinitionWrite,
    thematiques: TThematiqueRow[]
  ) => void;
  onCancel?: () => void;
}) => {
  const {indicateur, isSaving, thematiquesFiche, onSave, onCancel} = props;
  const [thematiques, setThematiques] = useState<TThematiqueRow[]>(
    thematiquesFiche ?? []
  );

  const handleSave = (data: TIndicateurPersoDefinitionWrite) => {
    onSave(data, thematiques);
  };

  return (
    <Formik<TIndicateurPersoDefinitionWrite>
      initialValues={indicateur}
      validateOnMount
      validationSchema={validation}
      onSubmit={handleSave}
    >
      {({isValid}) => (
        <Form>
          <div className="bg-grey975 fr-py-7w fr-px-10w">
            <p>
              Les indicateurs personnalisés vous permettent de suivre de manière
              spécifique les actions menées par votre collectivité. Associez-les
              à une ou plusieurs fiches action pour faciliter leur mise à jour !
            </p>
            <FormikInput name="titre" label="Nom de l’indicateur" />
            <FormikInput name="unite" label="Unité" />
            <FormikInput type="area" name="description" label="Description" />
            <FormField className="fr-mt-4w" label="Thématique">
              <ThematiquesDropdown
                values={
                  thematiques.length ? thematiques?.map(t => t.id) : undefined
                }
                onChange={thematiques => setThematiques(thematiques)}
              />
            </FormField>
          </div>
          <div className="flex flex-row justify-end gap-4 pt-5">
            {onCancel && (
              <button className="fr-btn fr-btn--secondary" onClick={onCancel}>
                Annuler
              </button>
            )}
            <button
              className={classNames('fr-btn', {
                'fr-btn--icon-right fr-icon-arrow-right-line': !isSaving,
              })}
              data-test="ok"
              disabled={isSaving || !isValid}
            >
              {isSaving ? 'Enregistrement en cours...' : 'Valider et compléter'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
