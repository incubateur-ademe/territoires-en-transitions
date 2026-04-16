import { appLabels } from '@/app/labels/catalog';
import { useListUserCollectiviteRoles } from '@/app/users/authorizations/use-list-user-collectivite-roles';
import { zodResolver } from '@hookform/resolvers/zod';
import { collectiviteRoleSchema } from '@tet/domain/users';
import {
  Field,
  Input,
  ModalFooterOKCancel,
  Select,
  SelectMultiple,
} from '@tet/ui';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Tag, useListPersonneTags } from '../../tags/use-list-personne-tags';

// validation du formulaire
const validationSchema = z.object({
  email: z.email({
    error: 'Un email valide est requis',
  }),
  niveau: collectiviteRoleSchema,
  tagIds: z.number().array().optional(),
});
type FormData = z.infer<typeof validationSchema>;

export type Props = {
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit: SubmitHandler<FormData>;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
  /** Valeurs par défaut des tags */
  defaultTagIds?: number[];
};

/**
 * Affiche le panneau de création d'une invitation à rejoindre une collectivité
 */
export const InviteMembreForm = (props: Props) => {
  const { onSubmit, onCancel, defaultTagIds } = props;
  const {
    control,
    formState: { isValid, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
  });

  const availableCollectiviteRoles = useListUserCollectiviteRoles();

  const { data: tags = [], isLoading: isLoadingTags } = useListPersonneTags();

  const filteredTags = tags.filter((tag) => !tag.email);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      data-test="SendInvite"
    >
      <div className="grid gap-6 lg:grid-cols-9">
        <Field
          title={appLabels.champAdresseEmailInvitation}
          htmlFor="email"
          className="lg:col-span-5"
        >
          <Input id="email" type="text" {...register('email')} />
        </Field>
        <Field
          title={appLabels.champNiveauAccesCollectivite}
          className="lg:col-span-4"
        >
          <Controller
            name="niveau"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select
                dataTest="niveau"
                options={availableCollectiviteRoles}
                values={value}
                onChange={onChange}
              />
            )}
          />
        </Field>
      </div>

      <Field
        title={appLabels.champAssocierTagsPilotes}
        state="info"
        message={appLabels.champAssocierTagsPilotesInfo}
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
