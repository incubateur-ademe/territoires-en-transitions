import { appLabels } from '@/app/labels/catalog';
import { LevierId } from '@tet/domain/shared';
import { Button, Field, Textarea } from '@tet/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSendActionSuggestion } from './use-send-action-suggestion';

const suggestActionSchema = z.object({
  description: z.string().trim().min(1, appLabels.actionDescriptionRequise),
});

type SuggestActionValues = z.infer<typeof suggestActionSchema>;

type SuggestActionFormProps = {
  levierId: LevierId;
  onSent: () => void;
  onCancel: () => void;
};

export const SuggestActionForm = ({
  levierId,
  onSent,
  onCancel,
}: SuggestActionFormProps): JSX.Element => {
  const sendSuggestion = useSendActionSuggestion();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuggestActionValues>({
    resolver: zodResolver(suggestActionSchema),
    mode: 'onChange',
    defaultValues: { description: '' },
  });

  const onSubmit = ({ description }: SuggestActionValues): void => {
    sendSuggestion(levierId, description);
    onSent();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Field
        state={errors.description ? 'error' : 'default'}
        message={errors.description?.message}
      >
        <Textarea
          {...register('description')}
          aria-label={appLabels.decrireLAction}
          placeholder={appLabels.decrireLAction}
          rows={4}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {appLabels.envoyer}
        </Button>
        <Button type="button" size="sm" variant="outlined" onClick={onCancel}>
          {appLabels.annuler}
        </Button>
      </div>
    </form>
  );
};
