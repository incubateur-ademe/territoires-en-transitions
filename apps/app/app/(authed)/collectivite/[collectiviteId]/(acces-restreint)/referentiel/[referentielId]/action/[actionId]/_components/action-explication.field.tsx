'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useUpdateActionExplication } from '@/app/referentiels/actions/use-update-action-explication';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Field, RichTextEditor, TextareaProps } from '@tet/ui';

type Props = TextareaProps & {
  action: ActionListItem;
  title?: string;
  hint?: string;
  fieldClassName?: string;
};

export const ActionExplicationField = ({
  action: { actionId, score },
  title,
  hint,
  disabled,
  placeholder,
}: Props) => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const { mutate: updateActionExplication } = useUpdateActionExplication();

  const isDisabled =
    !hasCollectivitePermission('referentiels.mutate') || disabled;

  return (
    <Field title={title} hint={hint} key={actionId} className="cursor-auto">
      <div onClick={(e) => e.stopPropagation()}>
        <RichTextEditor
          dataTest={`action-${actionId}-commentaire-editor`}
          className="[&_.bn-block-content]:py-0 [&_.bn-inline-content]:text-sm [&_.bn-inline-content]:leading-[1.25rem]"
          initialValue={score.explication}
          disabled={isDisabled}
          placeholder={placeholder ?? "Détaillez l'état d'avancement"}
          onBlurTextChanged={(htmlValue: string) => {
            if (htmlValue.trim() === score.explication?.trim()) {
              return;
            }

            updateActionExplication({
              actionId,
              collectiviteId,
              commentaire: htmlValue.trim(),
            });
          }}
        />
      </div>
    </Field>
  );
};
