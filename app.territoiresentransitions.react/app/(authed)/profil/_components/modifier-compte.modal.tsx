import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUpdateEmail } from '@/app/users/use-update-email';
import { useUpdatePersonalDetails } from '@/app/users/use-update-personal-details';
import {
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  validateTel,
} from '@/ui';

const validationSchema = z.object({
  prenom: z
    .string()
    .min(1, { message: 'Le prénom doit contenir au moins 1 lettre' }),
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 1 lettre' }),
  email: z.string().email({ message: 'Un email valide est requis' }),
  phoneNumber: z.string().refine(validateTel, {
    message: 'Un numéro de téléphone valide est requis',
  }),
});

type FormTypes = z.infer<typeof validationSchema>;

type Props = {
  user: UserDetails;
  isEmailConfirmed: boolean;
  children: JSX.Element;
};

const ModifierCompteModal = ({ user, isEmailConfirmed, children }: Props) => {
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
      // Le schema de validation attend des valeurs alors que UserDetails a le numéro
      // de tel et l'email en undefined.
      // Une string vide ne sera jamais envoyée car
      // la validation du formulaire ne passe pas validationSchema.
      phoneNumber: user.phone ?? '',
      email: user.new_email ? user.new_email : user.email ?? '', // de plus l'email est toujours défini via la table DCP
    },
  });

  const { handleUpdateDCP } = useUpdatePersonalDetails(user.id);

  const { handleUpdateEmail } = useUpdateEmail();

  const [isOpen, setIsOpen] = useState(false);

  const isEmailModified = watch('email') !== user.email;

  const onSubmit: SubmitHandler<FormTypes> = (data) => {
    handleUpdateDCP({
      prenom: data.prenom,
      nom: data.nom,
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
            state={errors.phoneNumber ? 'error' : undefined}
            message={errors.phoneNumber?.message}
          >
            <Input id="phoneNumber" type="tel" {...register('phoneNumber')} />
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
