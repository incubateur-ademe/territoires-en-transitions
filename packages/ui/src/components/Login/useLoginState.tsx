import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Crisp} from 'crisp-sdk-web';
import {LoginProps} from './type';

export type LoginState = ReturnType<typeof useLoginState>;

/**
 * Gère l'état du formulaire de connexion
 */
export const useLoginState = (props: LoginProps) => {
  const {view = 'par_lien', onSubmit} = props;

  // déclenche l'ouverture de la chatbox
  const contactSupport = () => {
    Crisp.chat.open();
  };

  // schéma de validation en fonction de la vue
  const isPasswordless = view !== 'par_mdp';
  const validationSchema = z.object({
    email: z.string().email({message: 'Un email valide est requis'}),
    password: z
      .string()
      .refine(value => (isPasswordless ? true : value.length > 0), {
        message: 'Mot de passe requis',
      }),
  });

  // état du formulaire
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(validationSchema),
  });

  // champs enregistrés
  const {register, handleSubmit} = form;
  const emailProps = register('email');
  const passwordProps = register('password');

  const onSubmitForm = handleSubmit(onSubmit);

  return {
    form,
    emailProps,
    passwordProps,
    contactSupport,
    onSubmitForm,
  };
};
