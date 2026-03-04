import { Button, Textarea } from '@tet/ui';
import { useState } from 'react';

type Props = {
  dataTest?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  numberOfRows?: number;
  disabled?: boolean;
  message?: string;
  onPublish?: () => void;
  autoFocus?: boolean;
};

const ActionNewDiscussionInput = ({
  dataTest,
  disabled,
  placeholder,
  onSave,
  numberOfRows = 1,
  message,
  onPublish,
  autoFocus = false,
}: Props) => {
  const [comment, setComment] = useState(message ?? '');

  const handlePublishComment = () => {
    if (comment.trim() !== (message ?? '').trim()) {
      onSave(comment);
    }
    setComment('');
    onPublish?.();
  };

  return (
    <div data-test={dataTest} className="flex gap-2">
      <Textarea
        value={comment}
        onChange={(evt) => setComment(evt.currentTarget.value)}
        placeholder={placeholder}
        size="xs"
        rows={numberOfRows}
        name="comment"
        disabled={disabled}
        autoFocus={autoFocus}
      />
      <div className="flex gap-2 justify-start items-start">
        <Button
          icon="send-plane-fill"
          title="Publier"
          variant="grey"
          size="xs"
          disabled={comment.trim().length === 0}
          onClick={handlePublishComment}
        />
      </div>
    </div>
  );
};

export default ActionNewDiscussionInput;
