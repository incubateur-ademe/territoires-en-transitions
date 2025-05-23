import { Field, Input, ModalFooterOKCancel, Select } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

// validation du formulaire
const validationSchema = z.object({
  email: z.string().email({ message: 'Un email valide est requis' }),
  niveau: z.enum(['lecture', 'edition', 'admin']),
});
type FormData = z.infer<typeof validationSchema>;

// options pour la liste déroulante "Niveau d'accès"
const AdminOption = { value: 'admin', label: 'Admin' };
const EditionOptions = [
  { value: 'edition', label: 'Édition' },
  { value: 'lecture', label: 'Lecture' },
];

export type Props = {
  /** Niveau de l'utilisateur sur la collectivité */
  niveauAcces: 'edition' | 'admin';
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit: SubmitHandler<FormData>;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
};

/**
 * Affiche le panneau de création d'une invitation à rejoindre une collectivité
 */
export const Invite = (props: Props) => {
  const { niveauAcces, onSubmit, onCancel } = props;
  const {
    control,
    formState: { isValid, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>({
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
  });

  const options =
    niveauAcces === 'admin' ? [AdminOption, ...EditionOptions] : EditionOptions;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
      data-test="SendInvite"
    >
      <div className="grid gap-6 md:grid-cols-9">
        <Field
          title="Adresse email de la personne à inviter *"
          htmlFor="email"
          className="md:col-span-5"
        >
          <Input id="email" type="text" {...register('email')} />
        </Field>
        <Field
          title="Niveau d’accès pour cette collectivité  * "
          className="md:col-span-4"
        >
          <Controller
            name="niveau"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select
                dataTest="niveau"
                options={options}
                values={value}
                onChange={onChange}
              />
            )}
          />
        </Field>
      </div>

      {/* <Field
        title="Associer l’utilisateur à un ou plusieurs tag(s) pilote(s)"
        state="info"
        message="Si vous avez ajouté une personne pilote à une fiche, une mesure ou un indicateur. ou à un indicateur alors qu'elle n'avait pas encore de compte dans l'application, elle apparaîtra dans cette liste. En l'associant à l'invitation, toutes les fiches, mesures et indicateurs. et tous les indicateurs qui lui sont associés seront automatiquement attribuées à ce nouveau compte."
      >
        <Select options={options} values={[]} onChange={() => {}} />
      </Field> */}

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
