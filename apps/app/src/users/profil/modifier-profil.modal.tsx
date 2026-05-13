'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { JSX, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { appLabels } from '@/app/labels/catalog';
import { useUpdateEmail } from '@/app/users/use-update-email';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { Field, FormSectionGrid, Input, validateTel } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useUpdateUser } from '../use-update-user';

const FORM_ID = 'modifier-profil-form';

const validationSchema = z.object({
  prenom: z.string().min(1, { error: appLabels.prenomMinLettreError }),
  nom: z.string().min(2, { error: appLabels.nomMinLettreError }),
  email: z.email({ error: appLabels.emailValideRequisError }),
  telephone: z
    .string()
    .refine(validateTel, { error: appLabels.telephoneValideRequisError }),
});

type FormTypes = z.infer<typeof validationSchema>;

type Props = {
  user: UserWithRolesAndPermissions;
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
      // Le schema de validation attend des valeurs alors que UserWithRolesAndPermissions a le numéro
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
      openState={{ isOpen: isOpen, setIsOpen: (open) => {
        setIsOpen(open);
        if (!open) reset();
       }}}
    >
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{appLabels.modifierMesInformations}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form
          id={FORM_ID}
          className="flex flex-col gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FormSectionGrid>
            <Field
              title={appLabels.prenomRequis}
              state={errors.prenom ? 'error' : undefined}
              message={errors.prenom?.message}
            >
              <Input id="prenom" type="text" {...register('prenom')} />
            </Field>
            <Field
              title={appLabels.nomRequis}
              state={errors.nom ? 'error' : undefined}
              message={errors.nom?.message}
            >
              <Input id="nom" type="text" {...register('nom')} />
            </Field>
          </FormSectionGrid>
          <Field
            title={appLabels.emailRequis}
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
                ? appLabels.changementEmailEnCours
                : isEmailModified
                ? appLabels.confirmationChangementEmail({
                    email: watch('email'),
                  })
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
            title={appLabels.numeroTelephoneRequis}
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
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok type="submit" form={FORM_ID} disabled={!isValid}>
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
