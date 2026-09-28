import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { indicateurVueNomSchema } from '@tet/domain/indicateurs';
import { Field, Input, ModalFooterOKCancel } from '@tet/ui';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const nameSchema = z.object({ nom: indicateurVueNomSchema });

type Props = {
  nom?: string;
  onSubmit: (nom: string) => Promise<boolean>;
  onCancel: () => void;
};

export function IndicateurVueNameForm({ nom = '', onSubmit, onCancel }: Props) {
  const nameId = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    mode: 'onChange',
    defaultValues: { nom },
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(async ({ nom }) => {
        if (await onSubmit(nom)) reset();
      })}
    >
      <Field
        htmlFor={nameId}
        title={appLabels.indicateurVueName}
        state={errors.nom ? 'error' : 'default'}
        message={errors.nom?.message}
      >
        <Input
          id={nameId}
          type="text"
          {...register('nom')}
          autoFocus
          maxLength={100}
          data-test="indicateurs.vues.nom"
        />
      </Field>
      <ModalFooterOKCancel
        btnCancelProps={{
          onClick: onCancel,
          disabled: isSubmitting,
          'data-test': 'indicateurs.vues.cancel',
        }}
        btnOKProps={{
          type: 'submit',
          disabled: !isValid || isSubmitting,
          children: appLabels.enregistrer,
          'data-test': 'indicateurs.vues.submit',
        }}
      />
    </form>
  );
}
