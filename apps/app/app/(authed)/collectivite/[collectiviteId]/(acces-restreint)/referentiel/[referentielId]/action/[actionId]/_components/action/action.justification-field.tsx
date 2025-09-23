'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '@/app/referentiels/use-action-commentaire';
import { Field, RichTextEditor, TextareaProps } from '@/ui';

type Props = TextareaProps & {
  actionId: string;
  title?: string;
  hint?: string;
  fieldClassName?: string;
};

export const ActionJustificationField = ({
  actionId,
  title,
  hint,
  fieldClassName,
  disabled,
}: Props) => {
  const collectivite = useCurrentCollectivite();
  const { actionCommentaire, isLoading } = useActionCommentaire(actionId);
  const { saveActionCommentaire } = useSaveActionCommentaire();
  const initialValue = actionCommentaire?.commentaire;

  return (
    <Field title={title} hint={hint} className={fieldClassName} key={actionId}>
      <RichTextEditor
        initialValue={initialValue}
        disabled={collectivite.isReadOnly || isLoading || disabled}
        debounceDelayOnChange={1000}
        placeholder="Explications sur l’état d’avancement (tapez '/' pour faire apparaître les options de mise en page)"
        onChange={(newValue: string) => {
          saveActionCommentaire({
            action_id: actionId,
            collectivite_id: collectivite.collectiviteId,
            commentaire: newValue ?? '',
          });
        }}
      />
    </Field>
  );
};
