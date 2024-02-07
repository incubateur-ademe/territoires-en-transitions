import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {ModalFooterOKCancel} from '@design-system/Modal';
import {Field} from '@design-system/Field';
import {Input} from '@design-system/Input';
import {Select} from '@design-system/Select';
import {SignupPropsWithState, UserRole} from './type';
import {FormSectionGrid} from '@design-system/FormSection';

const ROLES: Array<{value: UserRole; label: string}> = [
  {value: 'equipe_politique', label: 'Équipe politique'},
  {value: 'services_techniques', label: 'Directions et services techniques'},
  {value: 'partenaire', label: 'Partenaire'},
  {value: 'bureau_etudes', label: "Bureau d'études"},
];

/** Gestionnaire d'état pour le formulaire de l'étape 2 */
const useSignupStep2 = () => {
  const validationSchema = z.object({
    nom: z.string().min(1, 'Champ requis'),
    prenom: z.string().min(1, 'Champ requis'),
    tel: z.string().min(1, 'Champ requis'),
    role: z
      .string({invalid_type_error: 'Sélectionnez un rôle'})
      .min(1, 'Champ requis'),
    poste: z.string().optional(),
  });

  return useForm({
    resolver: zodResolver(validationSchema),
  });
};

/**
 * Affiche l'étape 2 du panneau de création de compte
 */
export const SignupStep2 = (props: SignupPropsWithState) => {
  const {
    handleSubmit,
    control,
    register,
    setValue,
    formState: {isValid, errors},
  } = useSignupStep2();

  const {
    onCancel,
    onSubmit,
    signupState: {formData},
  } = props;

  const onSubmitForm = data => {
    onSubmit({...formData, ...data});
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitForm)}>
      <FormSectionGrid>
        <Field
          title="Nom"
          htmlFor="nom"
          state={errors.nom ? 'error' : undefined}
          message={errors.nom?.message.toString()}
        >
          <Input id="nom" type="text" {...register('nom')} />
        </Field>
        <Field
          title="Prénom"
          htmlFor="prenom"
          state={errors.prenom ? 'error' : undefined}
          message={errors.prenom?.message.toString()}
        >
          <Input id="prenom" type="text" {...register('prenom')} />
        </Field>
        <Field
          className="md:col-span-2"
          title="Numéro de téléphone"
          htmlFor="tel"
          state={errors.tel ? 'error' : 'info'}
          message={
            errors.tel?.message.toString() ||
            "L'accès à votre numéro est réservé à l'équipe ADEME de l'outil et le contact par mail restera privilégié"
          }
        >
          <Input id="tel" type="text" {...register('tel')} />
        </Field>
        <Field
          title="Rôle"
          state={errors.role ? 'error' : undefined}
          message={errors.role?.message.toString()}
        >
          <Controller
            name="role"
            control={control}
            render={({field}) => (
              <Select
                options={ROLES}
                values={field.value ? [field.value] : undefined}
                onChange={value => {
                  setValue(
                    field.name,
                    field.value === value ? null : (value as string),
                    {
                      shouldValidate: true,
                    }
                  );
                }}
              />
            )}
          />
        </Field>
        <Field
          title="Intitulé de poste"
          htmlFor="poste"
          state={errors.poste ? 'error' : undefined}
          message={errors.poste?.message.toString()}
        >
          <Input id="poste" type="text" {...register('poste')} />
        </Field>
      </FormSectionGrid>
      <ModalFooterOKCancel
        btnCancelProps={{onClick: onCancel}}
        btnOKProps={{
          onClick: handleSubmit(onSubmitForm),
          disabled: !isValid,
        }}
      />
    </form>
  );
};
