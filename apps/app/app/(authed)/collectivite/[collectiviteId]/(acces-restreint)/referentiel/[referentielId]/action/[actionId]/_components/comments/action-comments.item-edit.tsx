import { Button, Textarea } from '@tet/ui';
import { useState } from 'react';

type Props = {
  dataTest?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  message?: string;
  onCancel: () => void;
};

const ActionCommentItemEdit = ({
  dataTest,
  placeholder,
  onSave,
  onCancel,
  message,
}: Props) => {
  const [comment, setComment] = useState(message ?? '');

  const handlePublishComment = () => {
    if (comment.trim() !== (message ?? '').trim()) {
      onSave(comment);
    } else {
      onCancel();
    }
  };

  return (
    <div data-test={dataTest} className="flex-col gap-2 mt-4">
      <Textarea
        className="field-sizing-content"
        value={comment}
        onChange={(evt) => setComment(evt.currentTarget.value)}
        placeholder={placeholder}
        name="comment"
        autoFocus={true}
        autoresize={true}
      />
      <div className="flex gap-2 justify-end items-start mt-2">
        <Button
          icon="close-line"
          size="xs"
          variant="outlined"
          disabled={comment.trim().length === 0}
          onClick={() => {
            setComment(message ?? '');
            onCancel();
          }}
        >
          Annuler
        </Button>
        <Button
          icon="save-line"
          size="xs"
          disabled={comment.trim().length === 0}
          onClick={handlePublishComment}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default ActionCommentItemEdit;
