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
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { actionCommentaire, isLoading } = useActionCommentaire(actionId);
  const { mutate: saveActionCommentaire } = useSaveActionCommentaire();
  const initialValue = actionCommentaire?.commentaire;

  return (
    <Field title={title} hint={hint} className={fieldClassName} key={actionId}>
      <RichTextEditor
        dataTest={`action-${actionId}-commentaire-editor`}
        className="[&_.bn-block-content]:py-0 [&_.bn-inline-content]:text-sm [&_.bn-inline-content]:leading-[1.25rem]"
        initialValue={initialValue}
        disabled={
          !hasCollectivitePermission('referentiels.mutate') ||
          isLoading ||
          disabled
        }
        debounceDelayOnChange={1000}
        placeholder="Détaillez l'état d'avancement"
        onChange={(newValue: string) => {
          saveActionCommentaire({
            actionId,
            collectiviteId,
            commentaire: newValue ?? '',
          });
        }}
      />
    </Field>
  );
};
