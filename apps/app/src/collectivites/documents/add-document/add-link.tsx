/**
 * Affiche le formulaire d'ajout de liens
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { appLabels } from '@/app/labels/catalog';
import { Button, Field, Input } from '@tet/ui';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  lienFormSchema,
  type LienFormValues,
} from '@/app/collectivites/documents/lien-schema';

export type AddLinkHandler = (titre: string, url: string) => void;

export type AddLinkProps = {
  onAddLink: AddLinkHandler;
  onClose: () => void;
};

export const AddLink = (props: AddLinkProps) => {
  const { onClose, onAddLink } = props;

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<LienFormValues>({
    mode: 'onChange',
    resolver: zodResolver(lienFormSchema),
    defaultValues: {
      titre: '',
      url: '',
    },
  });

  const onSubmit: SubmitHandler<LienFormValues> = ({ titre, url }) => {
    onAddLink(titre, url);
    onClose();
  };

  return (
    <form
      data-test="AddLink"
      className="flex flex-col gap-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex gap-6">
        <Field
          title={appLabels.titreLienObligatoire}
          htmlFor="titre"
          className="w-[35%]"
          state={errors.titre ? 'error' : 'default'}
          message={errors.titre?.message}
        >
          <Input id="titre" type="text" {...register('titre')} />
        </Field>
        <Field
          title={appLabels.lienObligatoire}
          htmlFor="url"
          className="w-[65%]"
          state={errors.url ? 'error' : 'default'}
          message={errors.url?.message}
        >
          <Input id="url" type="text" {...register('url')} />
        </Field>
      </div>
      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          {appLabels.annuler}
        </Button>
        <Button type="submit" data-test="ok" disabled={!isValid}>
          {appLabels.ajouter}
        </Button>
      </div>
    </form>
  );
};
