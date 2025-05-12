import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { RouterOutput } from '@/api/utils/trpc/client';
import {
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  validateTel,
} from '@/ui';
import { useUpdateUser } from './use-update-user';

const validationSchema = z.object({
  prenom: z
    .string()
    .min(1, { message: 'Le prénom doit contenir au moins 1 lettre' }),
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 1 lettre' }),
  email: z.string().email({ message: 'Un email valide est requis' }),
  telephone: z.string().refine(validateTel, {
    message: 'Un numéro de téléphone valide est requis',
  }),
});

type FormTypes = z.infer<typeof validationSchema>;

type Props = {
  user: NonNullable<RouterOutput['utilisateurs']['get']['user']>;
  isEmailConfirmed: boolean;
  defaultEmail: string;
  children: JSX.Element;
};

const ModifierCompteModal = ({
  user,
  isEmailConfirmed,
  defaultEmail,
  children,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    watch,
    reset,
  } = useForm({
    mode: 'onBlur',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      prenom: user.prenom,
      nom: user.nom,
      // La string vide permet de résoudre un conflit de types pour handleSubmit.
      // Le schema de validation attend des valeurs alors que le numéro de tel peut être undefined.
      // Une string vide ne sera jamais envoyée car la validation du formulaire ne passe pas validationSchema.
      telephone: user.telephone ?? '',
      email: defaultEmail,
    },
  });

  const { mutate: updateUser } = useUpdateUser();

  const [isOpen, setIsOpen] = useState(false);

  const isEmailModified = watch('email') !== user.email;

  const onSubmit: SubmitHandler<FormTypes> = (data) => {
    updateUser(data);
    setIsOpen(false);
  };

  return (
    <Modal
      title="Modifier mes informations"
      onClose={() => reset()}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <FormSectionGrid>
            <Field
              title="Prénom *"
              state={errors.prenom ? 'error' : undefined}
              message={errors.prenom?.message}
            >
              <Input id="prenom" type="text" {...register('prenom')} />
            </Field>
            <Field
              title="Nom *"
              state={errors.nom ? 'error' : undefined}
              message={errors.nom?.message}
            >
              <Input id="nom" type="text" {...register('nom')} />
            </Field>
          </FormSectionGrid>
          <Field
            title="Email *"
            state={
              errors.email
                ? 'error'
                : !isEmailConfirmed
                ? 'info'
                : isEmailModified
                ? 'warning'
                : undefined
            }
            message={
              errors.email
                ? errors.email?.message
                : !isEmailConfirmed
                ? 'Changement d’email en cours. Consultez vos mails pour confirmer votre nouvelle adresse.'
                : isEmailModified
                ? `Cette modification sera effective quand vous aurez cliqué sur le lien de validation du message envoyé à la nouvelle adresse associée à votre compte ${watch(
                    'email'
                  )}`
                : undefined
            }
          >
            <Input
              id="email"
              type="text"
              {...register('email')}
              disabled={!isEmailConfirmed}
            />
          </Field>
          <Field
            title="Numéro de téléphone *"
            state={errors.telephone ? 'error' : undefined}
            message={errors.telephone?.message}
          >
            <Input id="telephone" type="tel" {...register('telephone')} />
          </Field>
          <ModalFooterOKCancel
            btnCancelProps={{
              onClick: () => {
                setIsOpen(false);
                reset();
              },
            }}
            btnOKProps={{
              type: 'submit',
              disabled: !isValid,
            }}
          />
        </form>
      )}
    >
      {children}
    </Modal>
  );
};

export default ModifierCompteModal;
