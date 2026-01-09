'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { JSX, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useUpdateEmail } from '@/app/users/use-update-email';
import { UserWithCollectiviteAccesses } from '@tet/domain/users';
import {
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  validateTel,
} from '@tet/ui';
import { useUpdateUser } from './use-update-user';

const validationSchema = z.object({
  prenom: z.string().min(1, {
    error: 'Le prénom doit contenir au moins 1 lettre',
  }),
  nom: z.string().min(2, {
    error: 'Le nom doit contenir au moins 1 lettre',
  }),
  email: z.email({
    error: 'Un email valide est requis',
  }),
  telephone: z.string().refine(validateTel, {
    error: 'Un numéro de téléphone valide est requis',
  }),
});

type FormTypes = z.infer<typeof validationSchema>;

type Props = {
  user: UserWithCollectiviteAccesses;
  isEmailConfirmed: boolean;
  children: JSX.Element;
};

export const ModifierProfilModal = ({
  user,
  isEmailConfirmed,
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
      // Les string vides permettent de résoudre un conflit de types pour handleSubmit.
      // Le schema de validation attend des valeurs alors que UserWithCollectiviteAccesses a le numéro
      // de tel et l'email en undefined.
      // Une string vide ne sera jamais envoyée car
      // la validation du formulaire ne passe pas validationSchema.
      telephone: user.telephone ?? '',
      email: user.newEmail ? user.newEmail : user.email ?? '', // de plus l'email est toujours défini via la table DCP
    },
  });

  const { mutate: updateUser } = useUpdateUser();

  const { handleUpdateEmail } = useUpdateEmail();

  const [isOpen, setIsOpen] = useState(false);

  const isEmailModified = watch('email') !== user.email;

  const onSubmit: SubmitHandler<FormTypes> = (data) => {
    updateUser({
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone,
    });

    if (isEmailModified) {
      handleUpdateEmail({ email: data.email });
    }

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
            <Input
              id="telephone"
              type="tel"
              value={watch('telephone')}
              {...register('telephone')}
            />
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
