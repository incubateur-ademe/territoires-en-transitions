import { useCurrentCollectivite } from '@/api/collectivites';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '@/app/referentiels/use-action-commentaire';
import { AutoResizedTextarea, Field, TextareaProps } from '@/ui';
import { useEffect, useState } from 'react';

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
  ...props
}: Props) => {
  const collectivite = useCurrentCollectivite();
  const { actionCommentaire, isLoading } = useActionCommentaire(actionId);
  const { saveActionCommentaire } = useSaveActionCommentaire();

  const [commentaire, setCommentaire] = useState(
    actionCommentaire?.commentaire
  );

  useEffect(() => {
    setCommentaire(actionCommentaire?.commentaire);
  }, [actionCommentaire?.commentaire]);

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentaire(evt.currentTarget.value);
  };

  const handleBlur = () => {
    const initialValue = actionCommentaire?.commentaire;
    const newValue = commentaire?.trim();
    if (initialValue !== newValue) {
      saveActionCommentaire({
        action_id: actionId,
        collectivite_id: collectivite.collectiviteId,
        commentaire: newValue ?? '',
      });
    }
  };

  return (
    <Field title={title} hint={hint} className={fieldClassName}>
      <AutoResizedTextarea
        value={commentaire}
        onClick={(evt) => evt.stopPropagation()}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={collectivite.isReadOnly || isLoading || disabled}
        {...props}
      />
    </Field>
  );
};
