import {useState} from 'react';
import * as Yup from 'yup';
import {Form, Formik} from 'formik';
import {Alert, Button, Field, FormSectionGrid} from '@tet/ui';
import FormikInput from 'ui/shared/form/formik/FormikInput';
import {TIndicateurPersoDefinitionWrite} from './useInsertIndicateurPersoDefinition';
import {TThematiqueRow} from 'types/alias';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';

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
  onSave: (data: TIndicateurPersoDefinitionWrite) => void;
  onCancel?: () => void;
}) => {
  const {indicateur, isSaving, thematiquesFiche, onSave, onCancel} = props;
  const [thematiques, setThematiques] = useState<TThematiqueRow[]>(
    thematiquesFiche ?? []
  );

  const handleSave = (data: TIndicateurPersoDefinitionWrite) => {
    onSave({...data, thematiques});
  };

  return (
    <Formik<TIndicateurPersoDefinitionWrite>
      initialValues={indicateur}
      validateOnMount
      validationSchema={validation}
      onSubmit={handleSave}
    >
      {({isValid}) => (
        <Form className="flex flex-col gap-8">
          {/* Message d'information sur les indicateurs personnalisés */}
          <Alert
            description=" Les indicateurs personnalisés vous permettent de suivre de manière
              spécifique les actions menées par votre collectivité. Associez-les
              à une ou plusieurs fiches action pour faciliter leur mise à jour !"
          />

          {/* Champs du formulaire */}
          <FormSectionGrid>
            <div className="col-span-2 flex gap-6">
              <FormikInput
                name="titre"
                label="Nom de l’indicateur"
                className="w-[75%]"
              />
              <FormikInput name="unite" label="Unité" className="w-[25%]" />
            </div>

            <Field title="Thématique" className="col-span-2">
              <ThematiquesDropdown
                values={thematiques?.map(t => t.id)}
                onChange={({thematiques}) => setThematiques(thematiques)}
              />
            </Field>

            <FormikInput
              type="area"
              name="description"
              label="Description"
              className="col-span-2"
            />
          </FormSectionGrid>

          {/* Boutons de validation / annulation */}
          <div className="flex flex-row justify-end gap-4">
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button data-test="ok" disabled={isSaving || !isValid}>
              {isSaving ? 'Enregistrement en cours...' : 'Valider et compléter'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
