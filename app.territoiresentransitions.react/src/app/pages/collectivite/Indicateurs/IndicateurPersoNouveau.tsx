import {
  TIndicateurPersoDefinitionWrite,
  useInsertIndicateurPersoDefinition,
} from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useInsertIndicateurPersoDefinition';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import FormikInput from '@/app/ui/shared/form/formik/FormikInput';
import { Thematique } from '@/domain/shared';
import { Alert, Button, Checkbox, Field, FormSectionGrid } from '@/ui';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import * as Yup from 'yup';

const validation = Yup.object({
  titre: Yup.string()
    .max(300, 'Ce champ doit faire au maximum 300 caractères')
    .required('Un titre est requis'),
  unite: Yup.string(),
  description: Yup.string(),
});

/** Affiche la page de création d'un indicateur personnalisé  */
const IndicateurPersoNouveau = ({
  fiche,
  isFavoriCollectivite,
  onClose,
}: {
  /** Fiche action à laquelle rattacher le nouvel indicateur */
  fiche?: Fiche;
  isFavoriCollectivite?: boolean;
  onClose?: () => void;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const router = useRouter();
  const ficheId = fiche?.id;

  const { mutate: save, isPending } = useInsertIndicateurPersoDefinition({
    onSuccess: (indicateurId) => {
      // redirige vers la page de l'indicateur après la création
      const url = makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: 'perso',
        indicateurId,
      });
      onClose?.();
      if (ficheId !== undefined) {
        window.open(url, '_blank');
      } else {
        router.push(url);
      }
    },
  });

  const [thematiques, setThematiques] = useState<Thematique[]>(
    fiche?.thematiques ?? []
  );

  /**
   * Peut recevoir un state initial qui rend la checkbox disabled si donné à la modale de création
   * sinon garde un état local
   */
  const [favoriCollectivite, setFavoriCollectivite] = useState(
    isFavoriCollectivite ?? false
  );

  const onSave = (definition: TIndicateurPersoDefinitionWrite) => {
    definition = TEMPORARY_copyDescriptionToCommentaire(definition);
    save({
      definition: { ...definition, thematiques },
      ficheId,
      isFavoriCollectivite: favoriCollectivite,
    });
  };

  /**
   * Temporary: we're taking commentaire value from definition.description
   * -> step 2 of expand and contract pattern (
   * https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern).
   *
   * Next step: change
   *
   * <FormikInput
        type="area"
        name="description"
        label="Description"
        className="col-span-2"
      /> to
      <FormikInput
        type="area"
        name="commentaire"
        label="Commentaire"
        className="col-span-2"
      />
   *
   * Related to this PR: https://github.com/incubateur-ademe/territoires-en-transitions/pull/3313.
   */
  const TEMPORARY_copyDescriptionToCommentaire = (
    definition: TIndicateurPersoDefinitionWrite
  ): TIndicateurPersoDefinitionWrite => {
    return {
      ...definition,
      commentaire: definition.description,
    };
  };

  return (
    <Formik<TIndicateurPersoDefinitionWrite>
      initialValues={{
        collectiviteId,
        titre: '',
        description: '',
        unite: '',
      }}
      validateOnMount
      validationSchema={validation}
      onSubmit={onSave}
    >
      {({ isValid }) => (
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
                values={thematiques?.map((t) => t.id)}
                onChange={({ thematiques }) => setThematiques(thematiques)}
              />
            </Field>

            <FormikInput
              type="area"
              name="description"
              label="Description"
              className="col-span-2"
            />

            <Checkbox
              containerClassname="col-span-2"
              label="ajouter l’indicateur à la sélection d’indicateurs favoris de ma collectivité"
              checked={favoriCollectivite}
              onChange={() => setFavoriCollectivite(!favoriCollectivite)}
              disabled={isFavoriCollectivite}
            />
          </FormSectionGrid>

          {/* Boutons de validation / annulation */}
          <div className="flex flex-row justify-end gap-4 mt-2">
            {onClose && (
              <Button variant="outlined" onClick={onClose}>
                Annuler
              </Button>
            )}
            <Button data-test="ok" disabled={isPending || !isValid}>
              {isPending
                ? 'Enregistrement en cours...'
                : 'Valider et compléter'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default IndicateurPersoNouveau;
