import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  CGU_URL,
  Checkbox,
  DCP_URL,
  Event,
  Field,
  FieldMessage,
  FormSectionGrid,
  Input,
  ModalFooterOKCancel,
  useEventTracker,
  validateTel,
} from '@tet/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SignupDataStep3, SignupPropsWithState } from './type';

/** Gestionnaire d'état pour le formulaire de l'étape 3 */
const useSignupStep3 = () => {
  const validationSchema = z.object({
    nom: z.string().min(1, 'Champ requis'),
    prenom: z.string().min(1, 'Champ requis'),
    telephone: z.string().refine(validateTel),
    cgu_acceptees: z.boolean().refine((value) => !!value, {
      error: "Vous devez accepter le cadre d'utilisation de la plateforme",
    }),
  });

  return useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      telephone: '',
      cgu_acceptees: false,
    },
  });
};

/**
 * Affiche l'étape 3 du panneau de création de compte
 */
export const SignupStep3 = (props: SignupPropsWithState) => {
  const {
    handleSubmit,
    register,
    formState: { isValid, errors },
    watch,
  } = useSignupStep3();
  const eventTracker = useEventTracker();

  const cgu_acceptees = watch('cgu_acceptees');

  const {
    isLoading,
    error,
    onSubmit,
    formState: { email },
  } = props;

  const onSubmitForm = handleSubmit((data) => {
    onSubmit({ ...(data as SignupDataStep3), email });
    eventTracker(Event.auth.submitSignupDcp);
  });

  return (
    <>
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
            message={errors.telephone?.message?.toString()}
          >
            <Input id="telephone" type="tel" {...register('telephone')} />
          </Field>
        </FormSectionGrid>
        <hr className="mt-5" />
        <Checkbox
          data-test="accept-cgu"
          className="font-medium"
          label="J'accepte le cadre d'utilisation de la plateforme *"
          message={
            <>
              <Button variant="underlined" size="sm" href={CGU_URL}>
                Les conditions générales
              </Button>
              <span className="text-sm mx-2">|</span>
              <Button variant="underlined" size="sm" href={DCP_URL}>
                {"la politique de protection des données de l'ADEME"}
              </Button>
            </>
          }
          {...register('cgu_acceptees')}
          checked={cgu_acceptees ?? false}
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
    </>
  );
};
