'use client';

import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input } from '@tet/ui';
import { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAddReferent } from './data/use-add-referent';

const contactLibreSchema = z.object({
  libelle: z.string().trim().min(1, 'Le libellé est requis'),
  email: z.email('Adresse e-mail invalide').trim(),
});

type ContactLibre = z.infer<typeof contactLibreSchema>;

type Props = {
  collectiviteId: number;
  organismeId: number;
  onDone: () => void;
};

/** Pour une boîte fonctionnelle, ou toute personne sans compte. */
export const AddContactLibreForm = ({
  collectiviteId,
  organismeId,
  onDone,
}: Props): JSX.Element => {
  const { mutateAsync: addReferent, isPending } = useAddReferent();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ContactLibre>({
    resolver: zodResolver(contactLibreSchema),
    mode: 'onChange',
  });

  const onSubmit = async (contact: ContactLibre) => {
    await addReferent({ collectiviteId, organismeId, ...contact });
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-lg bg-grey-2 p-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Field
        title={appLabels.referentsPcaetContactLibelle}
        state={errors.libelle ? 'error' : 'default'}
        message={errors.libelle?.message}
        small
      >
        <Input
          type="text"
          displaySize="sm"
          data-test={`demarches.referents-pcaet.contact-libelle-${organismeId}`}
          {...register('libelle')}
        />
      </Field>
      <Field
        title={appLabels.referentsPcaetContactEmail}
        state={errors.email ? 'error' : 'default'}
        message={errors.email?.message}
        small
      >
        <Input
          type="text"
          displaySize="sm"
          data-test={`demarches.referents-pcaet.contact-email-${organismeId}`}
          {...register('email')}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outlined" size="xs" onClick={onDone}>
          {appLabels.annuler}
        </Button>
        <Button
          type="submit"
          size="xs"
          disabled={!isValid || isPending}
          dataTest={`demarches.referents-pcaet.contact-ajouter-${organismeId}`}
        >
          {appLabels.ajouter}
        </Button>
      </div>
    </form>
  );
};
