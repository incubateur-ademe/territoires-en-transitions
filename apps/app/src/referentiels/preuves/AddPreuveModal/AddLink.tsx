/**
 * Affiche le formulaire d'ajout de liens
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { appLabels } from '@/app/labels/catalog';
import { Button, Field, Input } from '@tet/ui';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

export type TAddLink = (titre: string, url: string) => void;

export type TAddLinkProps = {
  onAddLink: TAddLink;
  onClose: () => void;
};

const validationSchema = z.object({
  titre: z.string().min(1, appLabels.validationTitreLienRequis),
  url: z.string().url(appLabels.validationLienValide),
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
        <Field
          title={appLabels.titreLienObligatoire}
          htmlFor="titre"
          className="w-[35%]"
        >
          <Input id="titre" type="text" {...register('titre')} />
        </Field>
        <Field
          title={appLabels.lienObligatoire}
          htmlFor="url"
          className="w-[65%]"
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
