/**
 * Affiche le formulaire d'ajout de liens
 */

import { Button, Field, Input } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

export type TAddLink = (titre: string, url: string) => void;

export type TAddLinkProps = {
  onAddLink: TAddLink;
  onClose: () => void;
};

const validationSchema = z.object({
  titre: z.string().min(1, 'Merci de renseigner un titre pour ce lien'),
  url: z.string().url('Merci de renseigner un lien valide'),
});

type FormData = z.infer<typeof validationSchema>;

export const AddLink = (props: TAddLinkProps) => {
  const { onClose, onAddLink } = props;

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      titre: '',
      url: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = ({ titre, url }) => {
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
        <Field title="Titre (obligatoire)" htmlFor="titre" className="w-[35%]">
          <Input id="titre" type="text" {...register('titre')} />
        </Field>
        <Field title="Lien (obligatoire)" htmlFor="url" className="w-[65%]">
          <Input id="url" type="text" {...register('url')} />
        </Field>
      </div>
      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" data-test="ok" disabled={!isValid}>
          Ajouter
        </Button>
      </div>
    </form>
  );
};
