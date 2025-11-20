import { useAccessLevels } from '@/app/users/authorizations/use-access-levels';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CollectiviteAccessLevel,
  collectiviteAccessLevelSchema,
} from '@tet/domain/users';
import {
  Field,
  Input,
  ModalFooterOKCancel,
  Select,
  SelectMultiple,
} from '@tet/ui';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Tag, useListTags } from './use-list-tags';

// validation du formulaire
const validationSchema = z.object({
  email: z.email({
    error: 'Un email valide est requis',
  }),
  niveau: collectiviteAccessLevelSchema,
  tagIds: z.number().array().optional(),
});
type FormData = z.infer<typeof validationSchema>;

export type Props = {
  /** Niveau de l'utilisateur sur la collectivité */
  niveauAcces: CollectiviteAccessLevel;
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit: SubmitHandler<FormData>;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
  /** Id de la collectivité */
  collectiviteId: number;
  /** Valeurs par défaut des tags */
  defaultTagIds?: number[];
};

/**
 * Affiche le panneau de création d'une invitation à rejoindre une collectivité
 */
export const InviteMemberForm = (props: Props) => {
  const { niveauAcces, onSubmit, onCancel, collectiviteId, defaultTagIds } =
    props;
  const {
    control,
    formState: { isValid, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
  });

  const accessLevelsOptions = useAccessLevels({
    allowAdmin: niveauAcces === 'admin',
  });

  const { data: tags, isLoading: isLoadingTags } = useListTags(collectiviteId);

  const filteredTags: Tag[] = (tags as Tag[]).filter((tag: Tag) => !tag.email);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      data-test="SendInvite"
    >
      <div className="grid gap-6 lg:grid-cols-9">
        <Field
          title="Adresse email de la personne à inviter *"
          htmlFor="email"
          className="lg:col-span-5"
        >
          <Input id="email" type="text" {...register('email')} />
        </Field>
        <Field
          title="Niveau d’accès pour cette collectivité  * "
          className="lg:col-span-4"
        >
          <Controller
            name="niveau"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select
                dataTest="niveau"
                options={accessLevelsOptions}
                values={value}
                onChange={onChange}
              />
            )}
          />
        </Field>
      </div>

      <Field
        title="Associer l’utilisateur à un ou plusieurs tag(s) pilote(s)"
        state="info"
        message="Si vous avez ajouté une personne pilote à une fiche, une mesure ou un indicateur alors qu'elle n'avait pas encore de compte dans l'application, son nom apparaîtra dans cette liste. En l'associant à l'invitation, tous les éléments qui lui sont attribués seront automatiquement transférés vers son nouveau profil."
      >
        <Controller
          name="tagIds"
          defaultValue={defaultTagIds}
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectMultiple
              options={(filteredTags ?? []).map((t: Tag) => ({
                value: t.tagId,
                label: t.tagNom,
              }))}
              values={value}
              onChange={({ values }) => onChange(values)}
              isLoading={isLoadingTags}
            />
          )}
        />
      </Field>

      <ModalFooterOKCancel
        btnOKProps={{
          'data-test': 'ok',
          type: 'submit',
          disabled: !isValid || isLoading,
        }}
        btnCancelProps={{ onClick: onCancel }}
      />
    </form>
  );
};
