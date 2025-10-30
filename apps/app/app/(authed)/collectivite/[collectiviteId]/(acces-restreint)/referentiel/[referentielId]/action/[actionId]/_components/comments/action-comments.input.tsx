import { AutoResizedTextarea, Button } from '@/ui';
import { useState } from 'react';

type Props = {
  dataTest?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  numberOfRows?: number;
};

const ActionCommentInput = ({
  dataTest,
  placeholder,
  onSave,
  numberOfRows = 1,
}: Props) => {
  const [comment, setComment] = useState('');

  const onPublishComment = () => {
    onSave(comment);
    setComment('');
  };
  return (
    <div data-test={dataTest} className="flex gap-2">
      <AutoResizedTextarea
        value={comment}
        onChange={(evt) => setComment(evt.currentTarget.value)}
        placeholder={placeholder}
        containerClassname="shrink"
        displaySize="sm"
        rows={numberOfRows}
        name="comment"
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
