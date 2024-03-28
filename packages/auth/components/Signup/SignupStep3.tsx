import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Button,
  Checkbox,
  Input,
  validateTel,
  Field,
  FieldMessage,
  FormSectionGrid,
  ModalFooterOKCancel,
} from '@tet/ui';
import {SignupDataStep3, SignupPropsWithState} from './type';

const URL_CGU = 'https://territoiresentransitions.fr/cgu';
const URL_DCP = 'https://www.ademe.fr/donnees-personnelles/';

/** Gestionnaire d'état pour le formulaire de l'étape 3 */
const useSignupStep3 = () => {
  const validationSchema = z.object({
    nom: z.string().min(1, 'Champ requis'),
    prenom: z.string().min(1, 'Champ requis'),
    telephone: z.string().refine(validateTel),
    cgu_acceptees: z.boolean().refine(value => !!value, {
      message: "Vous devez accepter le cadre d'utilisation de la plateforme",
    }),
  });

  return useForm({
    resolver: zodResolver(validationSchema),
  });
};

/**
 * Affiche l'étape 3 du panneau de création de compte
 */
export const SignupStep3 = (props: SignupPropsWithState) => {
  const {
    handleSubmit,
    register,
    formState: {isValid, errors},
  } = useSignupStep3();

  const {
    isLoading,
    error,
    onSubmit,
    formState: {email},
  } = props;

  const onSubmitForm = handleSubmit(data => {
    onSubmit({...(data as SignupDataStep3), email});
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmitForm}>
      <FormSectionGrid>
        <Field
          title="Nom *"
          htmlFor="nom"
          state={errors.nom ? 'error' : undefined}
          message={errors.nom?.message?.toString()}
        >
          <Input id="nom" type="text" {...register('nom')} />
        </Field>
        <Field
          title="Prénom *"
          htmlFor="prenom"
          state={errors.prenom ? 'error' : undefined}
          message={errors.prenom?.message?.toString()}
        >
          <Input id="prenom" type="text" {...register('prenom')} />
        </Field>
        <Field
          className="md:col-span-2"
          title="Numéro de téléphone professionnel *"
          htmlFor="telephone"
          state={errors.telephone ? 'error' : 'info'}
          message={
            errors.telephone?.message?.toString() ||
            "L'accès à votre numéro est réservé à l'équipe ADEME de l'outil et le contact par mail restera privilégié"
          }
        >
          <Input id="telephone" type="tel" {...register('telephone')} />
        </Field>
      </FormSectionGrid>
      <hr className="mt-5" />
      <Checkbox
        data-test="accept-cgu"
        className="font-medium"
        label="J’accepte le cadre d’utilisation de la plateforme *"
        message={
          <>
            <Button variant="underlined" size="sm" href={URL_CGU}>
              Les conditions générales
            </Button>
            <span className="text-sm mx-2">|</span>
            <Button variant="underlined" size="sm" href={URL_DCP}>
              la politique de protection des données de l'ADEME
            </Button>
          </>
        }
        {...register('cgu_acceptees')}
      />
      {!!error && (
        <FieldMessage messageClassName="mt-4" state="error" message={error} />
      )}
      <ModalFooterOKCancel
        btnOKProps={{
          type: 'submit',
          disabled: !isValid || isLoading,
        }}
      />
    </form>
  );
};
