import { useCollectiviteId } from '@/api/collectivites';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useCreateIndicateurDefinition } from '@/app/indicateurs/definitions/use-create-indicateur-definition';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import {
  Alert,
  Button,
  Checkbox,
  Field,
  FormSectionGrid,
  Input,
  Textarea,
} from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const validationSchema = z.object({
  titre: z
    .string()
    .min(1, 'Un titre est requis')
    .max(300, 'Ce champ doit faire au maximum 300 caractères'),
  unite: z.string().optional(),
  commentaire: z.string().optional(),
});

type FormData = z.infer<typeof validationSchema>;

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
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const ficheId = fiche?.id;

  const { mutate: createIndicateur, isPending } = useCreateIndicateurDefinition(
    {
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
    }
  );

  const [thematiqueIds, setThematiqueIds] = useState<number[]>(
    fiche?.thematiques?.map((item) => item.id) ?? []
  );

  /**
   * Peut recevoir un state initial qui rend la checkbox disabled si donné à la modale de création
   * sinon garde un état local
   */
  const [favoriCollectivite, setFavoriCollectivite] = useState(
    isFavoriCollectivite ?? false
  );

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      titre: '',
      commentaire: '',
      unite: '',
    },
  });

  const onSave: SubmitHandler<FormData> = (data) => {
    const { titre, commentaire, unite } = data;
    createIndicateur({
      collectiviteId,
      titre,
      commentaire: commentaire || '',
      thematiques: (thematiqueIds ?? []).map((id) => ({ id })),
      unite: unite || '',
      ficheId,
      estFavori: favoriCollectivite,
    });
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSave)}>
      {/* Message d'information sur les indicateurs personnalisés */}
      <Alert
        description=" Les indicateurs personnalisés vous permettent de suivre de manière
              spécifique les actions menées par votre collectivité. Associez-les
              à une ou plusieurs fiches action pour faciliter leur mise à jour !"
      />

      {/* Champs du formulaire */}
      <FormSectionGrid>
        <div className="col-span-2 flex gap-6">
          <Field
            title="Nom de l'indicateur"
            htmlFor="titre"
            className="w-[75%]"
          >
            <Input id="titre" type="text" {...register('titre')} />
          </Field>
          <Field title="Unité" htmlFor="unite" className="w-[25%]">
            <Input id="unite" type="text" {...register('unite')} />
          </Field>
        </div>

        <Field title="Thématique" className="col-span-2">
          <ThematiquesDropdown
            values={thematiqueIds}
            onChange={setThematiqueIds}
          />
        </Field>

        <Field
          title="Description et méthodologie de calcul"
          htmlFor="commentaire"
          className="col-span-2"
        >
          <Textarea id="commentaire" {...register('commentaire')} />
        </Field>

        <Checkbox
          containerClassname="col-span-2"
          label="Ajouter l’indicateur à la sélection d’indicateurs favoris de ma collectivité"
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
        <Button type="submit" data-test="ok" disabled={isPending || !isValid}>
          {isPending ? 'Enregistrement en cours...' : 'Valider et compléter'}
        </Button>
      </div>
    </form>
  );
};

export default IndicateurPersoNouveau;
