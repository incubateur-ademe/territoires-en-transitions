'use client';

import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '@/app/referentiels/use-action-commentaire';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Field, RichTextEditor, TextareaProps } from '@tet/ui';

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
        className="[&_.bn-block-content]:py-0 [&_.bn-inline-content]:text-sm [&_.bn-inline-content]:leading-[1.25rem]"
        initialValue={initialValue}
        disabled={collectivite.isReadOnly || isLoading || disabled}
        debounceDelayOnChange={1000}
        placeholder="Détaillez l'état d'avancement"
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
