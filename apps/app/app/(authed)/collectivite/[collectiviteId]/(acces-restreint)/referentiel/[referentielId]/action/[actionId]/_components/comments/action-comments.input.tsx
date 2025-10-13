import { AutoResizedTextarea, Button } from '@/ui';
import { useState } from 'react';

type Props = {
  dataTest?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  numberOfRows?: number;
  disabled?: boolean;
  message?: string;
};

const ActionCommentInput = ({
  dataTest,
  disabled,
  placeholder,
  onSave,
  numberOfRows = 1,
  message,
}: Props) => {
  const [comment, setComment] = useState(message ?? '');

  const onPublishComment = () => {
    onSave(comment);
    setComment('');
  };
  return (
    <div data-test={dataTest} className="flex gap-2">
      <AutoResizedTextarea
        onBlur={() => {
          onPublishComment();
        }}
        value={comment}
        onChange={(evt) => setComment(evt.currentTarget.value)}
        placeholder={placeholder}
        containerClassname="shrink"
        displaySize="sm"
        rows={numberOfRows}
        name="comment"
        disabled={disabled}
      />
      <div className="flex justify-start items-start">
        <Button
          icon="send-plane-fill"
          title="Publier"
          variant="grey"
          size="xs"
          disabled={comment.trim().length === 0}
          onClick={onPublishComment}
        />
      </div>
    </div>
  );
};

export default ActionCommentInput;
